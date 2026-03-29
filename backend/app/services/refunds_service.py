# @AI-HINT: Refunds service layer - all database operations for refund endpoints
from datetime import datetime, timezone
from typing import Optional

from app.db.turso_http import execute_query, to_str, parse_date


def _row_to_refund(row) -> dict:
    """Convert Turso row to refund dict"""
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "payment_id": int(row[1].get("value")) if row[1].get("type") != "null" else None,
        "amount": float(row[2].get("value")) if row[2].get("type") != "null" else 0.0,
        "reason": to_str(row[3]),
        "requested_by": int(row[4].get("value")) if row[4].get("type") != "null" else None,
        "approved_by": int(row[5].get("value")) if row[5].get("type") != "null" else None,
        "status": to_str(row[6]) or "pending",
        "processed_at": parse_date(row[7]),
        "created_at": parse_date(row[8]),
        "updated_at": parse_date(row[9])
    }


_REFUND_COLUMNS = "id, payment_id, amount, reason, requested_by, approved_by, status, processed_at, created_at, updated_at"


def get_payment_for_refund(payment_id: int) -> Optional[dict]:
    """Get payment info needed for refund validation."""
    result = execute_query("SELECT id, from_user_id, amount, status FROM payments WHERE id = ?", [payment_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "from_user_id": int(row[1].get("value")),
        "amount": float(row[2].get("value")) if row[2].get("type") != "null" else 0.0,
        "status": to_str(row[3])
    }


def check_existing_refund(payment_id: int) -> bool:
    """Check if a pending or approved refund already exists for a payment."""
    existing = execute_query("""
        SELECT id FROM refunds WHERE payment_id = ? AND status IN ('pending', 'approved')
    """, [payment_id])
    return bool(existing and existing.get("rows"))


def create_refund(payment_id: int, amount: float, reason: str, requested_by: int) -> Optional[dict]:
    """Create a refund request and return it."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        INSERT INTO refunds (payment_id, amount, reason, requested_by, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
    """, [payment_id, amount, reason, requested_by, now, now])

    result = execute_query(f"""
        SELECT {_REFUND_COLUMNS}
        FROM refunds WHERE payment_id = ? AND requested_by = ? ORDER BY id DESC LIMIT 1
    """, [payment_id, requested_by])

    if not result or not result.get("rows"):
        return None
    return _row_to_refund(result["rows"][0])


def list_refunds(user_id: int, is_admin: bool, status_filter: Optional[str],
                 page: int, page_size: int) -> tuple:
    """List refunds based on role, with pagination. Returns (refunds, total)."""
    if not is_admin:
        sql = f"SELECT {_REFUND_COLUMNS} FROM refunds WHERE requested_by = ?"
        params: list = [user_id]
    else:
        sql = f"SELECT {_REFUND_COLUMNS} FROM refunds WHERE 1=1"
        params = []

    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)

    count_sql = sql.replace(f"SELECT {_REFUND_COLUMNS}", "SELECT COUNT(*)")
    count_result = execute_query(count_sql, params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(count_result["rows"][0][0].get("value"))

    offset = (page - 1) * page_size
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([page_size, offset])

    result = execute_query(sql, params)
    refunds = []
    if result and result.get("rows"):
        for row in result["rows"]:
            refunds.append(_row_to_refund(row))

    return refunds, total


def get_refund_by_id(refund_id: int) -> Optional[dict]:
    """Fetch a refund by its ID."""
    result = execute_query(f"SELECT {_REFUND_COLUMNS} FROM refunds WHERE id = ?", [refund_id])
    if not result or not result.get("rows"):
        return None
    return _row_to_refund(result["rows"][0])


def get_refund_for_update(refund_id: int) -> Optional[dict]:
    """Get refund ownership/status info for update validation."""
    result = execute_query("SELECT id, requested_by, status FROM refunds WHERE id = ?", [refund_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "requested_by": int(row[1].get("value")),
        "status": to_str(row[2])
    }


def update_refund_fields(refund_id: int, update_dict: dict):
    """Update specified fields on a refund."""
    update_fields = []
    params = []
    for field, value in update_dict.items():
        update_fields.append(f"{field} = ?")
        params.append(value)

    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(refund_id)
        execute_query(f"UPDATE refunds SET {', '.join(update_fields)} WHERE id = ?", params)


def get_refund_status(refund_id: int, include_reason: bool = False):
    """Get the status of a refund, optionally including reason."""
    if include_reason:
        result = execute_query("SELECT id, status, reason FROM refunds WHERE id = ?", [refund_id])
        if not result or not result.get("rows"):
            return None
        return {"status": to_str(result["rows"][0][1]), "reason": to_str(result["rows"][0][2]) or ""}
    result = execute_query("SELECT id, status FROM refunds WHERE id = ?", [refund_id])
    if not result or not result.get("rows"):
        return None
    return to_str(result["rows"][0][1])


def approve_refund(refund_id: int, approved_by: int):
    """Set refund status to approved."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE refunds SET status = 'approved', approved_by = ?, updated_at = ? WHERE id = ?
    """, [approved_by, now, refund_id])


def reject_refund(refund_id: int, current_reason: str, rejection_reason: str):
    """Set refund status to rejected with appended reason."""
    new_reason = f"{current_reason}\n\nRejection reason: {rejection_reason}"
    now = datetime.now(timezone.utc).isoformat()
    execute_query("""
        UPDATE refunds SET status = 'rejected', reason = ?, updated_at = ? WHERE id = ?
    """, [new_reason, now, refund_id])


def get_refund_for_processing(refund_id: int) -> Optional[dict]:
    """Get refund details needed for processing."""
    result = execute_query("""
        SELECT id, payment_id, amount, requested_by, status FROM refunds WHERE id = ?
    """, [refund_id])
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(row[0].get("value")),
        "payment_id": int(row[1].get("value")),
        "amount": float(row[2].get("value")) if row[2].get("type") != "null" else 0.0,
        "requested_by": int(row[3].get("value")),
        "status": to_str(row[4])
    }


def get_user_balance(user_id: int) -> float:
    """Get user's account_balance."""
    result = execute_query("SELECT account_balance FROM users WHERE id = ?", [user_id])
    if result and result.get("rows"):
        return float(result["rows"][0][0].get("value")) if result["rows"][0][0].get("type") != "null" else 0.0
    return 0.0


def process_refund(refund_id: int, payment_id: int, requested_by: int,
                   amount: float, current_balance: float):
    """Execute the refund: update user balance, payment status, and refund status."""
    now = datetime.now(timezone.utc).isoformat()
    # Atomic balance update to prevent race conditions
    execute_query("UPDATE users SET account_balance = account_balance + ? WHERE id = ?", [amount, requested_by])
    execute_query("UPDATE payments SET status = 'refunded' WHERE id = ?", [payment_id])
    execute_query("""
        UPDATE refunds SET status = 'processed', processed_at = ?, updated_at = ? WHERE id = ?
    """, [now, now, refund_id])


def delete_refund(refund_id: int):
    """Delete a refund by ID."""
    execute_query("DELETE FROM refunds WHERE id = ?", [refund_id])
