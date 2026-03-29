# @AI-HINT: Admin endpoints for fraud alerts management and monitoring (Turso-backed)
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from app.db.turso_http import execute_query
from app.core.security import get_current_user, check_admin_role
from app.models import User
from app.services.db_utils import paginate_params

router = APIRouter()


class FraudAlertUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_dict(row, cols):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in cols]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


@router.get("")
async def list_fraud_alerts(
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    alert_status: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
):
    """List fraud alerts."""
    check_admin_role(user)
    offset, limit = paginate_params(page, page_size)
    conditions = ["1=1"]
    params = []
    if alert_status:
        conditions.append("fa.status = ?")
        params.append(alert_status)
    if severity:
        conditions.append("fa.severity = ?")
        params.append(severity)
    where = " AND ".join(conditions)
    params.extend([limit, offset])
    result = execute_query(
        f"""SELECT fa.id, fa.user_id, fa.alert_type, fa.severity, fa.description, fa.details,
                   fa.status, fa.resolved_by, fa.resolved_at, fa.created_at, fa.updated_at,
                   u.name as user_name, u.email as user_email
            FROM fraud_alerts fa
            LEFT JOIN users u ON fa.user_id = u.id
            WHERE {where} ORDER BY fa.created_at DESC LIMIT ? OFFSET ?""",
        params
    )
    cols = result.get("columns", result.get("cols", []))
    alerts = [_row_dict(row, cols) for row in result.get("rows", [])]
    count_result = execute_query(f"SELECT COUNT(*) FROM fraud_alerts fa WHERE {where}", params[:-2])
    total = _val(count_result["rows"][0][0]) if count_result.get("rows") else 0
    return {"alerts": alerts, "total": total, "page": page, "page_size": page_size}


@router.patch("/{alert_id}")
async def update_fraud_alert(alert_id: int, update: FraudAlertUpdate, user: User = Depends(get_current_user)):
    """Update fraud alert status."""
    check_admin_role(user)
    existing = execute_query("SELECT id FROM fraud_alerts WHERE id = ?", [alert_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Alert not found")
    now = datetime.now(timezone.utc).isoformat()
    uid = user.id if hasattr(user, "id") else user.get("user_id")
    sets = ["updated_at = ?"]
    params = [now]
    if update.status:
        sets.append("status = ?")
        params.append(update.status)
        if update.status == "resolved":
            sets.append("resolved_by = ?")
            sets.append("resolved_at = ?")
            params.extend([uid, now])
    if update.resolution_notes:
        sets.append("details = COALESCE(details, '') || ? ")
        params.append(f"\nResolution: {update.resolution_notes}")
    params.append(alert_id)
    execute_query(f"UPDATE fraud_alerts SET {', '.join(sets)} WHERE id = ?", params)
    return {"success": True, "alert_id": alert_id, "updated_at": now}


@router.post("/users/{user_id}/block")
async def block_user(user_id: int, reason: str = "Policy violation", user: User = Depends(get_current_user)):
    """Block user account."""
    check_admin_role(user)
    execute_query("UPDATE users SET is_active = 0 WHERE id = ?", [user_id])
    now = datetime.now(timezone.utc).isoformat()
    admin_id = user.id if hasattr(user, "id") else user.get("user_id")
    execute_query(
        "INSERT INTO fraud_alerts (user_id, alert_type, severity, description, status, resolved_by, resolved_at, created_at, updated_at) VALUES (?, 'account_blocked', 'high', ?, 'resolved', ?, ?, ?, ?)",
        [user_id, f"Account blocked: {reason}", admin_id, now, now, now]
    )
    execute_query(
        "INSERT INTO security_events (user_id, event_type, details, risk_level, created_at) VALUES (?, 'account_blocked', ?, 'high', ?)",
        [user_id, f"Blocked by admin: {reason}", now]
    )
    return {"success": True, "user_id": user_id, "blocked": True}


@router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: int, user: User = Depends(get_current_user)):
    """Unblock user account."""
    check_admin_role(user)
    execute_query("UPDATE users SET is_active = 1 WHERE id = ?", [user_id])
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO security_events (user_id, event_type, details, risk_level, created_at) VALUES (?, 'account_unblocked', 'Unblocked by admin', 'low', ?)",
        [user_id, now]
    )
    return {"success": True, "user_id": user_id, "blocked": False}


@router.get("/security-events/{user_id}")
async def get_user_security_events(
    user_id: int,
    user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
):
    """Get user security events."""
    check_admin_role(user)
    result = execute_query(
        "SELECT id, user_id, event_type, ip_address, user_agent, details, risk_level, created_at FROM security_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        [user_id, limit]
    )
    cols = result.get("columns", result.get("cols", []))
    events = [_row_dict(row, cols) for row in result.get("rows", [])]
    return {"user_id": user_id, "events": events}


@router.get("/alerts-summary")
async def get_alerts_summary(user: User = Depends(get_current_user)):
    """Get fraud alerts summary from real data."""
    check_admin_role(user)
    total = execute_query("SELECT COUNT(*) FROM fraud_alerts")
    pending = execute_query("SELECT COUNT(*) FROM fraud_alerts WHERE status = 'pending'")
    critical = execute_query("SELECT COUNT(*) FROM fraud_alerts WHERE severity = 'critical'")
    resolved = execute_query("SELECT COUNT(*) FROM fraud_alerts WHERE status = 'resolved'")
    recent = execute_query("SELECT COUNT(*) FROM fraud_alerts WHERE created_at >= datetime('now', '-1 day')")
    return {
        "total": _val(total["rows"][0][0]) if total.get("rows") else 0,
        "pending": _val(pending["rows"][0][0]) if pending.get("rows") else 0,
        "critical": _val(critical["rows"][0][0]) if critical.get("rows") else 0,
        "resolved": _val(resolved["rows"][0][0]) if resolved.get("rows") else 0,
        "recent_24h": _val(recent["rows"][0][0]) if recent.get("rows") else 0,
    }
