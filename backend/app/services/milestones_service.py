# @AI-HINT: Service layer for milestone management - data access and business logic via Turso HTTP
"""
Milestones Service - Data access and business logic for milestone endpoints.
Handles milestone CRUD, submission, approval, rejection, payment creation, and notifications.
"""
import logging
import json
from datetime import datetime, timezone
from typing import List, Optional
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, to_str, parse_date


def _row_to_milestone(row) -> dict:
    """Convert Turso row to milestone dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "contract_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "title": to_str(row[2]),
        "description": to_str(row[3]),
        "amount": float(row[4].get("value")) if row[4].get("type") != "null" else 0.0,
        "due_date": parse_date(row[5]),
        "status": to_str(row[6]) or "pending",
        "deliverables": to_str(row[7]),
        "submission_notes": to_str(row[8]),
        "approval_notes": to_str(row[9]),
        "submitted_at": parse_date(row[10]),
        "approved_at": parse_date(row[11]),
        "created_at": parse_date(row[12]),
        "updated_at": parse_date(row[13])
    }


MILESTONE_SELECT_COLS = ("id, contract_id, title, description, amount, due_date, status, "
                         "deliverables, submission_notes, approval_notes, submitted_at, "
                         "approved_at, created_at, updated_at")


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
    """Get just client_id and freelancer_id."""
    result = execute_query("SELECT client_id, freelancer_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "client_id": int(row[0].get("value")),
        "freelancer_id": int(row[1].get("value")),
    }


def get_contract_client_id(contract_id: int) -> Optional[int]:
    """Get just client_id for a contract."""
    result = execute_query("SELECT client_id FROM contracts WHERE id = ?", [contract_id])
    if not result or not result.get("rows"):
        return None
    return int(result["rows"][0][0].get("value"))


def create_milestone(contract_id: int, title: str, description: Optional[str],
                     amount: float, due_date: Optional[str]) -> Optional[dict]:
    """Insert a new milestone and return it."""
    now = datetime.now(timezone.utc).isoformat()
    insert_result = execute_query("""
        INSERT INTO milestones (contract_id, title, description, amount, due_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    """, [contract_id, title, description, amount, due_date, now, now])
    if not insert_result:
        return None

    result = execute_query(f"""
        SELECT {MILESTONE_SELECT_COLS}
        FROM milestones WHERE contract_id = ? ORDER BY id DESC LIMIT 1
    """, [contract_id])
    if not result or not result.get("rows"):
        return None
    return _row_to_milestone(result["rows"][0])


def list_milestones(contract_id: int, status_filter: Optional[str],
                    skip: int, limit: int) -> List[dict]:
    """List milestones for a contract."""
    sql = f"SELECT {MILESTONE_SELECT_COLS} FROM milestones WHERE contract_id = ?"
    params: list = [contract_id]
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    sql += " ORDER BY due_date ASC LIMIT ? OFFSET ?"
    params.extend([limit, skip])

    result = execute_query(sql, params)
    if not result or not result.get("rows"):
        return []
    return [_row_to_milestone(row) for row in result["rows"]]


def get_milestone_by_id(milestone_id: int) -> Optional[dict]:
    """Get a single milestone by ID."""
    result = execute_query(f"SELECT {MILESTONE_SELECT_COLS} FROM milestones WHERE id = ?", [milestone_id])
    if not result or not result.get("rows"):
        return None
    return _row_to_milestone(result["rows"][0])


def get_milestone_core(milestone_id: int) -> Optional[dict]:
    """Get milestone id, contract_id, and status for validation."""
    result = execute_query("SELECT id, contract_id, status FROM milestones WHERE id = ?", [milestone_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "contract_id": int(row[1].get("value")),
        "status": to_str(row[2]),
    }


def get_milestone_for_approval(milestone_id: int) -> Optional[dict]:
    """Get milestone details needed for approval/payment creation."""
    result = execute_query("""
        SELECT id, contract_id, status, amount, title FROM milestones WHERE id = ?
    """, [milestone_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "contract_id": int(row[1].get("value")),
        "status": to_str(row[2]),
        "amount": float(row[3].get("value")) if row[3].get("type") != "null" else 0.0,
        "title": to_str(row[4]),
    }


def update_milestone_fields(milestone_id: int, update_data: dict):
    """Apply partial update to a milestone."""
    update_fields = []
    params: list = []
    for field, value in update_data.items():
        if field == "due_date" and value:
            update_fields.append(f"{field} = ?")
            params.append(value.isoformat())
        else:
            update_fields.append(f"{field} = ?")
            params.append(value)
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(milestone_id)
        execute_query(f"UPDATE milestones SET {', '.join(update_fields)} WHERE id = ?", params)


def submit_milestone(milestone_id: int, deliverables: Optional[str], submission_notes: Optional[str]):
    """Mark milestone as submitted."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE milestones SET status = 'submitted', deliverables = ?, submission_notes = ?,
                              submitted_at = ?, updated_at = ?
        WHERE id = ?
    """, [deliverables, submission_notes, now, now, milestone_id])


def approve_milestone(milestone_id: int, approval_notes: Optional[str]):
    """Mark milestone as approved."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE milestones SET status = 'approved', approval_notes = ?, approved_at = ?, updated_at = ?
        WHERE id = ?
    """, [approval_notes, now, now, milestone_id])


def create_payment_record(contract_id: int, milestone_id: int, client_id: int,
                          freelancer_id: int, amount: float, platform_fee: float,
                          freelancer_amount: float, title: str) -> Optional[int]:
    """Create a payment record for an approved milestone. Returns payment_id."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO payments (contract_id, milestone_id, from_user_id, to_user_id, amount,
                             platform_fee, freelancer_amount, payment_type, payment_method,
                             status, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'milestone', 'escrow', 'pending', ?, ?, ?)
    """, [contract_id, milestone_id, client_id, freelancer_id, amount, platform_fee,
          freelancer_amount, f"Payment for milestone: {title}", now, now])

    result = execute_query("SELECT id FROM payments WHERE milestone_id = ? ORDER BY id DESC LIMIT 1",
                           [milestone_id])
    if result and result.get("rows"):
        return int(result["rows"][0][0].get("value"))
    return None


def create_invoice(contract_id: int, milestone_id: int, freelancer_id: int,
                   client_id: int, amount: float, payment_id: Optional[int], title: str):
    """Create an invoice for an approved milestone."""
    now = datetime.now(timezone.utc).isoformat()
    invoice_number = f"INV-{contract_id}-{milestone_id}-{int(datetime.now(timezone.utc).timestamp())}"
    items = json.dumps([{"description": f"Milestone: {title}", "amount": amount}])
    execute_query("""
        INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id,
                              subtotal, total, status, payment_id, items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)
    """, [invoice_number, contract_id, freelancer_id, client_id,
          amount, amount, payment_id, items, now, now])


def check_and_complete_contract(contract_id: int):
    """Auto-complete contract if all milestones are approved."""
    result = execute_query(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved FROM milestones WHERE contract_id = ?",
        [contract_id]
    )
    if result and result.get("rows"):
        row = result["rows"][0]
        total = int(row[0].get("value", 0))
        approved = int(row[1].get("value", 0))
        if total > 0 and total == approved:
            now = datetime.now(timezone.utc).isoformat()
            execute_query(
                "UPDATE contracts SET status = 'completed', updated_at = ? WHERE id = ? AND status != 'completed'",
                [now, contract_id]
            )


def reject_milestone(milestone_id: int, rejection_notes: str):
    """Reject milestone submission, returning to pending status."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE milestones SET status = 'pending', approval_notes = ?, submitted_at = NULL, updated_at = ?
        WHERE id = ?
    """, [rejection_notes, now, milestone_id])


def delete_milestone(milestone_id: int):
    """Delete a milestone record."""
    execute_query("DELETE FROM milestones WHERE id = ?", [milestone_id])


def get_user_email(user_id: int) -> Optional[str]:
    """Get user email by ID."""
    result = execute_query("SELECT email FROM users WHERE id = ?", [user_id])
    if result and result.get("rows"):
        return to_str(result["rows"][0][0])
    return None


def get_user_name(user_id: int) -> Optional[str]:
    """Get user name by ID."""
    result = execute_query("SELECT name FROM users WHERE id = ?", [user_id])
    if result and result.get("rows"):
        return to_str(result["rows"][0][0])
    return None
