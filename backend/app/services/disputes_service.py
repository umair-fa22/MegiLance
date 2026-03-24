# @AI-HINT: Service layer for dispute management - data access and business logic via Turso HTTP
"""
Disputes Service - Data access and business logic for dispute endpoints.
Handles dispute creation, listing, assignment, resolution, evidence, and notifications.
"""
import logging
import json
from datetime import datetime, timezone
from typing import List, Optional
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, to_str, parse_date


def _row_to_dispute(row) -> dict:
    """Convert Turso row to dispute dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "contract_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "raised_by_id": int(row[2].get("value")) if row[2].get("type") != "null" else None,
        "dispute_type": to_str(row[3]),
        "description": to_str(row[4]),
        "status": to_str(row[5]) or "open",
        "assigned_to_id": int(row[6].get("value")) if row[6].get("type") != "null" else None,
        "resolution": to_str(row[7]),
        "created_at": parse_date(row[8]),
        "updated_at": parse_date(row[9])
    }


DISPUTE_SELECT_COLS = ("id, contract_id, raised_by_id, dispute_type, description, "
                       "status, assigned_to_id, resolution, created_at, updated_at")


def send_notification(user_id: int, notification_type: str, title: str,
                      content: str, data: dict, priority: str, action_url: str):
    """Insert a notification record."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO notifications (user_id, notification_type, title, content, data,
                                   priority, action_url, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, [user_id, notification_type, title, content, json.dumps(data), priority, action_url, now])


def get_contract_parties(contract_id: int) -> Optional[dict]:
    """Get client_id and freelancer_id for a contract."""
    result = execute_query("SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "client_id": int(row[1].get("value")),
        "freelancer_id": int(row[2].get("value")),
    }


def get_contract_client_freelancer(contract_id: int) -> Optional[dict]:
    """Get just client_id and freelancer_id for a contract."""
    result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "client_id": int(row[0].get("value")),
        "freelancer_id": int(row[1].get("value")),
    }


def create_dispute(contract_id: int, raised_by_id: int, dispute_type: str, description: str) -> Optional[dict]:
    """Create a dispute and mark contract as disputed."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO disputes (contract_id, raised_by_id, dispute_type, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'open', ?, ?)
    """, [contract_id, raised_by_id, dispute_type, description, now, now])

    execute_query("UPDATE contracts SET status = 'disputed', updated_at = ? WHERE id = ?", [now, contract_id])

    result = execute_query(f"""
        SELECT {DISPUTE_SELECT_COLS}
        FROM disputes WHERE contract_id = ? AND raised_by_id = ? ORDER BY id DESC LIMIT 1
    """, [contract_id, raised_by_id])
    if not result or not result.get("rows"):
        return None
    return _row_to_dispute(result["rows"][0])


def get_admin_user_ids() -> List[int]:
    """Get all admin user IDs."""
    result = execute_query("SELECT id FROM users WHERE user_type = 'Admin'", [])
    if not result or not result.get("rows"):
        return []
    return [int(r[0].get("value")) for r in result["rows"]]


def get_user_contract_ids(user_id: int) -> List[int]:
    """Get contract IDs where user is client or freelancer."""
    result = execute_query(
        "SELECT id FROM contracts WHERE client_id = ? OR freelancer_id = ?",
        [user_id, user_id]
    )
    if not result or not result.get("rows"):
        return []
    return [int(r[0].get("value")) for r in result["rows"]]


def list_disputes(user_type: str, user_id: int, contract_id: Optional[int],
                  status_filter: Optional[str], dispute_type: Optional[str],
                  raised_by_me: bool, skip: int, limit: int) -> dict:
    """List disputes with filtering. Returns {total, disputes}."""
    if user_type != "admin":
        contract_ids = get_user_contract_ids(user_id)
        if not contract_ids:
            return {"total": 0, "disputes": []}
        placeholders = ",".join(["?" for _ in contract_ids])
        sql = f"SELECT {DISPUTE_SELECT_COLS} FROM disputes WHERE contract_id IN ({placeholders})"
        params = list(contract_ids)
    else:
        sql = f"SELECT {DISPUTE_SELECT_COLS} FROM disputes WHERE 1=1"
        params = []

    if contract_id:
        sql += " AND contract_id = ?"
        params.append(contract_id)
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    if dispute_type:
        sql += " AND dispute_type = ?"
        params.append(dispute_type)
    if raised_by_me:
        sql += " AND raised_by_id = ?"
        params.append(user_id)

    count_sql = sql.replace(f"SELECT {DISPUTE_SELECT_COLS}", "SELECT COUNT(*)")
    count_result = execute_query(count_sql, params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(count_result["rows"][0][0].get("value"))

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])

    result = execute_query(sql, params)
    disputes = []
    if result and result.get("rows"):
        disputes = [_row_to_dispute(row) for row in result["rows"]]
    return {"total": total, "disputes": disputes}


def get_dispute_by_id(dispute_id: int) -> Optional[dict]:
    """Get a single dispute by ID."""
    result = execute_query(f"SELECT {DISPUTE_SELECT_COLS} FROM disputes WHERE id = ?", [dispute_id])
    if not result or not result.get("rows"):
        return None
    return _row_to_dispute(result["rows"][0])


def get_dispute_contract_id(dispute_id: int) -> Optional[dict]:
    """Get dispute's id, contract_id, and status."""
    result = execute_query("SELECT id, contract_id, status FROM disputes WHERE id = ?", [dispute_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "contract_id": int(row[1].get("value")),
        "status": to_str(row[2]),
    }


def update_dispute(dispute_id: int, update_dict: dict):
    """Apply partial update to a dispute."""
    update_fields = []
    params = []
    for field, value in update_dict.items():
        if hasattr(value, 'value'):
            value = value.value
        update_fields.append(f"{field} = ?")
        params.append(value)
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(dispute_id)
        execute_query(f"UPDATE disputes SET {', '.join(update_fields)} WHERE id = ?", params)


def dispute_exists(dispute_id: int) -> bool:
    """Check if a dispute exists."""
    result = execute_query("SELECT id FROM disputes WHERE id = ?", [dispute_id])
    return bool(result and result.get("rows"))


def get_user_type(user_id: int) -> Optional[str]:
    """Get a user's type (Admin/Client/Freelancer)."""
    result = execute_query("SELECT id, user_type FROM users WHERE id = ?", [user_id])
    if not result or not result.get("rows"):
        return None
    return to_str(result["rows"][0][1])


def assign_dispute(dispute_id: int, admin_id: int):
    """Assign a dispute to an admin and set status to in_progress."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE disputes SET assigned_to_id = ?, status = 'in_progress', updated_at = ? WHERE id = ?
    """, [admin_id, now, dispute_id])


def resolve_dispute(dispute_id: int, resolution: str):
    """Mark dispute as resolved."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE disputes SET status = 'resolved', resolution = ?, updated_at = ? WHERE id = ?
    """, [resolution, now, dispute_id])


def update_contract_status(contract_id: int, new_status: str):
    """Update a contract's status."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?", [new_status, now, contract_id])


def get_dispute_evidence(dispute_id: int) -> Optional[dict]:
    """Get dispute id, contract_id, and current evidence JSON."""
    result = execute_query("SELECT id, contract_id, evidence FROM disputes WHERE id = ?", [dispute_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "contract_id": int(row[1].get("value")),
        "evidence_json": to_str(row[2]),
    }


def update_dispute_evidence(dispute_id: int, evidence_json: str):
    """Update the evidence JSON for a dispute."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("UPDATE disputes SET evidence = ?, updated_at = ? WHERE id = ?",
                  [evidence_json, now, dispute_id])
