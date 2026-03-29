# @AI-HINT: Service layer for time entries CRUD - all execute_query calls for time_entries router
"""
Time Entries Service - Business logic and data access for time tracking.
Handles time entry CRUD, submissions, approvals, rejections, and invoice creation.
"""

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.db.turso_http import execute_query, to_str, parse_date, parse_rows

logger = logging.getLogger(__name__)


def row_to_time_entry(row: list) -> dict:
    """Convert a database row to a time entry dict"""
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "user_id": row[1].get("value") if row[1].get("type") != "null" else None,
        "contract_id": row[2].get("value") if row[2].get("type") != "null" else None,
        "description": to_str(row[3]),
        "start_time": parse_date(row[4]),
        "end_time": parse_date(row[5]),
        "duration_minutes": row[6].get("value") if row[6].get("type") != "null" else None,
        "hourly_rate": float(row[7].get("value")) if row[7].get("type") != "null" else None,
        "amount": float(row[8].get("value")) if row[8].get("type") != "null" else None,
        "billable": bool(row[9].get("value")) if row[9].get("type") != "null" else True,
        "status": to_str(row[10]) or "draft",
        "created_at": parse_date(row[11]),
        "updated_at": parse_date(row[12])
    }


_TIME_ENTRY_COLUMNS = (
    "id, user_id, contract_id, description, start_time, end_time, "
    "duration_minutes, hourly_rate, amount, billable, status, created_at, updated_at"
)


def send_notification(user_id: int, notification_type: str, title: str,
                      content: str, data: dict, priority: str, action_url: str) -> None:
    """Send notification using Turso."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO notifications (user_id, notification_type, title, content, data,
                                   priority, action_url, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, [user_id, notification_type, title, content, json.dumps(data), priority, action_url, now])


# === Contract helpers ===

def get_contract_freelancer_id(contract_id: int) -> Optional[int]:
    """Get the freelancer_id for a contract. Returns None if not found."""
    result = execute_query(
        "SELECT id, freelancer_id FROM contracts WHERE id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return row[1].get("value") if row[1].get("type") != "null" else None


def has_active_time_entry(user_id: int, contract_id: int) -> bool:
    """Check if user has an active (no end_time) entry for a contract."""
    result = execute_query(
        "SELECT id FROM time_entries WHERE user_id = ? AND contract_id = ? AND end_time IS NULL",
        [user_id, contract_id]
    )
    return bool(result and result.get("rows"))


def get_user_hourly_rate(user_id: int) -> Optional[float]:
    """Get user's hourly rate from users table."""
    result = execute_query("SELECT hourly_rate FROM users WHERE id = ?", [user_id])
    if result and result.get("rows"):
        val = result["rows"][0][0]
        if val.get("type") != "null":
            return float(val.get("value"))
    return None


def get_contract_access_info(contract_id: int) -> Optional[Dict[str, Any]]:
    """Get contract client/freelancer IDs for access checks."""
    result = execute_query(
        "SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "client_id": row[1].get("value") if row[1].get("type") != "null" else None,
        "freelancer_id": row[2].get("value") if row[2].get("type") != "null" else None,
    }


def get_contract_client_id(contract_id: int) -> Optional[int]:
    """Get the client_id for a contract."""
    result = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        return None
    val = result["rows"][0][0]
    return val.get("value") if val.get("type") != "null" else None


def get_client_contract_ids(client_id: int) -> List[int]:
    """Get all contract IDs belonging to a client."""
    result = execute_query(
        "SELECT id FROM contracts WHERE client_id = ?", [client_id]
    )
    if not result or not result.get("rows"):
        return []
    return [r[0].get("value") for r in result["rows"]]


# === Time entry CRUD ===

def create_time_entry(user_id: int, contract_id: int, description: str,
                      start_time: str, hourly_rate: Optional[float],
                      billable: bool, entry_status: str) -> Optional[dict]:
    """Insert a time entry. Returns the created entry dict or None."""
    now = datetime.now(timezone.utc).isoformat()
    result = execute_query(
        """INSERT INTO time_entries (user_id, contract_id, description, start_time, hourly_rate, billable, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [user_id, contract_id, description, start_time, hourly_rate,
         1 if billable else 0, entry_status, now, now]
    )
    if not result:
        return None

    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    rows = parse_rows(id_result) if id_result else []
    entry_id = int(rows[0]["id"]) if rows else None
    return fetch_time_entry(entry_id)


def fetch_time_entry(entry_id: int) -> Optional[dict]:
    """Fetch a single time entry by ID."""
    result = execute_query(
        f"SELECT {_TIME_ENTRY_COLUMNS} FROM time_entries WHERE id = ?",
        [entry_id]
    )
    if not result or not result.get("rows"):
        return None
    return row_to_time_entry(result["rows"][0])


def stop_time_entry(entry_id: int, end_time_str: str, duration_minutes: int,
                    amount: Optional[float]) -> Optional[dict]:
    """Set end_time, duration, amount on a time entry. Returns updated entry."""
    execute_query(
        """UPDATE time_entries SET end_time = ?, duration_minutes = ?, amount = ?, updated_at = ?
           WHERE id = ?""",
        [end_time_str, duration_minutes, amount, datetime.now(timezone.utc).isoformat(), entry_id]
    )
    return fetch_time_entry(entry_id)


def list_time_entries(user_id: int, user_type: str,
                      contract_id: Optional[int] = None,
                      entry_status: Optional[str] = None,
                      start_date: Optional[str] = None,
                      end_date: Optional[str] = None,
                      limit: int = 50, offset: int = 0) -> List[dict]:
    """List time entries with filters based on user role."""
    conditions: list = []
    params: list = []

    if user_type == "freelancer":
        conditions.append("te.user_id = ?")
        params.append(user_id)
    elif user_type == "client":
        cids = get_client_contract_ids(user_id)
        if not cids:
            return []
        placeholders = ",".join(["?" for _ in cids])
        conditions.append(f"te.contract_id IN ({placeholders})")
        params.extend(cids)

    if contract_id:
        conditions.append("te.contract_id = ?")
        params.append(contract_id)
    if entry_status:
        conditions.append("te.status = ?")
        params.append(entry_status)
    if start_date:
        conditions.append("te.start_time >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("te.start_time <= ?")
        params.append(end_date)

    where_clause = " AND ".join(conditions) if conditions else "1=1"
    params.extend([limit, offset])

    result = execute_query(
        f"""SELECT te.id, te.user_id, te.contract_id, te.description, te.start_time, te.end_time,
                   te.duration_minutes, te.hourly_rate, te.amount, te.billable, te.status,
                   te.created_at, te.updated_at
            FROM time_entries te
            WHERE {where_clause}
            ORDER BY te.start_time DESC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result or not result.get("rows"):
        return []
    return [row_to_time_entry(row) for row in result["rows"]]


def get_time_summary(contract_id: int) -> Dict[str, Any]:
    """Get aggregated time entry summary for a contract."""
    result = execute_query(
        """SELECT 
            COUNT(*) as entry_count,
            COALESCE(SUM(duration_minutes), 0) as total_minutes,
            COALESCE(SUM(amount), 0) as total_amount,
            COALESCE(SUM(CASE WHEN billable = 1 THEN duration_minutes ELSE 0 END), 0) as billable_minutes,
            COALESCE(SUM(CASE WHEN billable = 1 THEN amount ELSE 0 END), 0) as billable_amount
           FROM time_entries WHERE contract_id = ?""",
        [contract_id]
    )

    if not result or not result.get("rows"):
        return {
            "entry_count": 0, "total_minutes": 0, "total_amount": 0.0,
            "billable_minutes": 0, "billable_amount": 0.0
        }

    row = result["rows"][0]
    return {
        "entry_count": row[0].get("value", 0) if row[0].get("type") != "null" else 0,
        "total_minutes": row[1].get("value", 0) if row[1].get("type") != "null" else 0,
        "total_amount": float(row[2].get("value", 0)) if row[2].get("type") != "null" else 0,
        "billable_minutes": row[3].get("value", 0) if row[3].get("type") != "null" else 0,
        "billable_amount": float(row[4].get("value", 0)) if row[4].get("type") != "null" else 0,
    }


def update_time_entry(entry_id: int, update_dict: dict) -> Optional[dict]:
    """Update time entry fields. Returns updated entry."""
    if not update_dict:
        return fetch_time_entry(entry_id)

    for key in ["start_time", "end_time"]:
        if key in update_dict and update_dict[key]:
            update_dict[key] = update_dict[key].isoformat() if hasattr(update_dict[key], 'isoformat') else update_dict[key]

    _ALLOWED_TIME_ENTRY_COLUMNS = frozenset({
        "description", "start_time", "end_time", "duration_minutes",
        "amount", "is_billable", "task_description", "updated_at",
    })

    set_parts = []
    params: list = []
    for field, value in update_dict.items():
        if field not in _ALLOWED_TIME_ENTRY_COLUMNS:
            continue
        set_parts.append(f"{field} = ?")
        params.append(value)

    set_parts.append("updated_at = ?")
    params.append(datetime.now(timezone.utc).isoformat())
    params.append(entry_id)

    execute_query(
        f"UPDATE time_entries SET {', '.join(set_parts)} WHERE id = ?",
        params
    )
    return fetch_time_entry(entry_id)


def recalculate_duration_and_amount(entry_id: int, start_time, end_time) -> Optional[dict]:
    """Recalculate duration/amount from times and persist. Returns updated entry."""
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00").replace("+00:00", ""))
    if isinstance(end_time, str):
        end_time = datetime.fromisoformat(end_time.replace("Z", "+00:00").replace("+00:00", ""))

    duration_minutes = int((end_time - start_time).total_seconds() / 60)

    entry = fetch_time_entry(entry_id)
    amount = None
    if entry and entry["billable"] and entry["hourly_rate"]:
        amount = (duration_minutes / 60) * entry["hourly_rate"]

    execute_query(
        "UPDATE time_entries SET duration_minutes = ?, amount = ? WHERE id = ?",
        [duration_minutes, amount, entry_id]
    )
    return fetch_time_entry(entry_id)


def get_entry_for_delete(entry_id: int) -> Optional[dict]:
    """Get minimal entry data for delete validation."""
    result = execute_query(
        "SELECT id, user_id, status FROM time_entries WHERE id = ?",
        [entry_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "user_id": row[1].get("value") if row[1].get("type") != "null" else None,
        "status": to_str(row[2]) or "draft"
    }


def delete_time_entry(entry_id: int) -> None:
    """Delete a time entry."""
    execute_query("DELETE FROM time_entries WHERE id = ?", [entry_id])


def get_entries_for_submit(entry_ids: List[int]) -> List[dict]:
    """Get entries by IDs for submission validation."""
    placeholders = ",".join(["?" for _ in entry_ids])
    result = execute_query(
        f"SELECT id, user_id, contract_id, status FROM time_entries WHERE id IN ({placeholders})",
        entry_ids
    )
    if not result or not result.get("rows"):
        return []

    entries = []
    for row in result["rows"]:
        entries.append({
            "id": row[0].get("value"),
            "user_id": row[1].get("value"),
            "contract_id": row[2].get("value"),
            "status": to_str(row[3])
        })
    return entries


def submit_entries(entry_ids: List[int]) -> None:
    """Set entries status to submitted."""
    placeholders = ",".join(["?" for _ in entry_ids])
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        f"UPDATE time_entries SET status = 'submitted', updated_at = ? WHERE id IN ({placeholders})",
        [now] + entry_ids
    )


def get_entries_for_review(entry_ids: List[int]) -> List[dict]:
    """Get entries by IDs for approval/rejection validation."""
    placeholders = ",".join(["?" for _ in entry_ids])
    result = execute_query(
        f"SELECT id, contract_id, status, amount, user_id FROM time_entries WHERE id IN ({placeholders})",
        entry_ids
    )
    if not result or not result.get("rows"):
        return []
    entries = []
    for row in result["rows"]:
        entries.append({
            "id": row[0].get("value"),
            "contract_id": row[1].get("value"),
            "status": to_str(row[2]),
            "amount": float(row[3].get("value")) if row[3].get("type") != "null" else 0.0,
            "user_id": row[4].get("value")
        })
    return entries


def approve_entries(entry_ids: List[int]) -> None:
    """Set entries status to approved."""
    placeholders = ",".join(["?" for _ in entry_ids])
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        f"UPDATE time_entries SET status = 'approved', updated_at = ? WHERE id IN ({placeholders})",
        [now] + entry_ids
    )


def create_invoice(invoice_number: str, contract_id: int, freelancer_id: int,
                   client_id: int, total_amount: float, items_json: str) -> None:
    """Create an invoice record."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id,
                              subtotal, total, status, items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'due', ?, ?, ?)
    """, [invoice_number, contract_id, freelancer_id, client_id,
          total_amount, total_amount, items_json, now, now])


def reject_entries(entry_ids: List[int]) -> None:
    """Set entries status to rejected."""
    placeholders = ",".join(["?" for _ in entry_ids])
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        f"UPDATE time_entries SET status = 'rejected', updated_at = ? WHERE id IN ({placeholders})",
        [now] + entry_ids
    )

