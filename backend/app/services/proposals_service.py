# @AI-HINT: Service layer for proposals CRUD - all execute_query calls for proposals router
# @FIX-MARKER: Updated fee_info key access to use 'platform_fee' instead of 'fee'
"""
Proposals Service - Business logic and data access for proposal management.
Handles proposal CRUD, acceptance/rejection, and contract auto-creation.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import json

from app.db.turso_http import execute_query, to_str, parse_date
from app.services.db_utils import get_val as _get_val, safe_str as _safe_str

logger = logging.getLogger(__name__)


def _proposal_from_row(row: list) -> dict:
    """Convert Turso row to proposal dict"""
    data = {
        "id": int(_get_val(row, 0) or 0),
        "project_id": int(_get_val(row, 1) or 0),
        "freelancer_id": int(_get_val(row, 2) or 0),
        "cover_letter": _safe_str(_get_val(row, 3)),
        "bid_amount": float(_get_val(row, 4) or 0),
        "estimated_hours": float(_get_val(row, 5) or 0),
        "hourly_rate": float(_get_val(row, 6) or 0),
        "availability": _safe_str(_get_val(row, 7)),
        "attachments": _safe_str(_get_val(row, 8)),
        "status": _safe_str(_get_val(row, 9)),
        "is_draft": bool(_get_val(row, 10)),
        "created_at": parse_date(_get_val(row, 11)),
        "updated_at": parse_date(_get_val(row, 12))
    }

    if len(row) > 13:
        data["job_title"] = _safe_str(_get_val(row, 13))
    if len(row) > 14:
        data["client_name"] = _safe_str(_get_val(row, 14))

    return data


# === Query functions ===

def get_draft_proposals(freelancer_id: int, project_id: Optional[int] = None) -> List[dict]:
    """Get all draft proposals for a freelancer."""
    where_sql = "WHERE p.freelancer_id = ? AND p.is_draft = 1"
    params: list = [freelancer_id]

    if project_id:
        where_sql += " AND p.project_id = ?"
        params.append(project_id)

    result = execute_query(
        f"""SELECT p.id, p.project_id, p.freelancer_id, p.cover_letter, p.bid_amount,
            p.estimated_hours, p.hourly_rate, p.availability, p.attachments, p.status,
            p.is_draft, p.created_at, p.updated_at,
            pr.title as job_title
            FROM proposals p
            LEFT JOIN projects pr ON p.project_id = pr.id
            {where_sql}""",
        params
    )

    drafts = []
    if result and result.get("rows"):
        for row in result["rows"]:
            drafts.append(_proposal_from_row(row))
    return drafts


def project_exists(project_id: int) -> bool:
    """Check if a project exists."""
    result = execute_query("SELECT id FROM projects WHERE id = ?", [project_id])
    return bool(result and result.get("rows"))


def create_draft_proposal(freelancer_id: int, proposal_data: dict) -> Optional[dict]:
    """
    Insert a draft proposal. Returns the created proposal dict or None on failure.
    """
    now = datetime.now(timezone.utc).isoformat()
    insert_result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status, is_draft,
           created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            proposal_data["project_id"],
            freelancer_id,
            proposal_data.get("cover_letter", ""),
            proposal_data.get("bid_amount", 0),
            proposal_data.get("estimated_hours", 0),
            proposal_data.get("hourly_rate", 0),
            proposal_data.get("availability", ""),
            proposal_data.get("attachments", ""),
            "draft",
            1,
            now,
            now
        ]
    )

    if not insert_result:
        return None

    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE freelancer_id = ? AND project_id = ? AND is_draft = 1
           ORDER BY id DESC LIMIT 1""",
        [freelancer_id, proposal_data["project_id"]]
    )

    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    return None


def get_client_project_ids(client_id: int) -> List[int]:
    """Get all project IDs belonging to a client."""
    proj_result = execute_query(
        "SELECT id FROM projects WHERE client_id = ?",
        [client_id]
    )
    if not proj_result or not proj_result.get("rows"):
        return []
    return [int(_get_val(row, 0) or 0) for row in proj_result["rows"]]


def list_proposals(
    user_id: int,
    user_type: str,
    project_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
) -> List[dict]:
    """List proposals visible to the current user."""
    if user_type and user_type.lower() == "freelancer":
        where_sql = "WHERE p.freelancer_id = ?"
        params: list = [user_id]
    else:
        project_ids = get_client_project_ids(user_id)
        if not project_ids:
            return []
        placeholders = ",".join(["?" for _ in project_ids])
        where_sql = f"WHERE p.project_id IN ({placeholders})"
        params = list(project_ids)

    if project_id:
        where_sql += " AND p.project_id = ?"
        params.append(project_id)

    if status_filter:
        where_sql += " AND p.status = ?"
        params.append(status_filter)

    params.extend([limit, skip])

    result = execute_query(
        f"""SELECT p.id, p.project_id, p.freelancer_id, p.cover_letter, p.bid_amount,
            p.estimated_hours, p.hourly_rate, p.availability, p.attachments, p.status,
            p.is_draft, p.created_at, p.updated_at,
            pr.title as job_title, u.name as client_name
            FROM proposals p
            LEFT JOIN projects pr ON p.project_id = pr.id
            LEFT JOIN users u ON pr.client_id = u.id
            {where_sql}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    proposals = []
    if result and result.get("rows"):
        for row in result["rows"]:
            proposals.append(_proposal_from_row(row))
    return proposals


def get_proposal_with_joins(proposal_id: int) -> Optional[dict]:
    """Get a proposal with project title and client name joined."""
    result = execute_query(
        """SELECT p.id, p.project_id, p.freelancer_id, p.cover_letter, p.bid_amount,
           p.estimated_hours, p.hourly_rate, p.availability, p.attachments, p.status,
           p.is_draft, p.created_at, p.updated_at,
           pr.title as job_title, u.name as client_name
           FROM proposals p
           LEFT JOIN projects pr ON p.project_id = pr.id
           LEFT JOIN users u ON pr.client_id = u.id
           WHERE p.id = ?""",
        [proposal_id]
    )
    if not result or not result.get("rows"):
        return None
    return _proposal_from_row(result["rows"][0])


def get_proposal_raw(proposal_id: int) -> Optional[dict]:
    """Get a proposal without joins. Returns raw row data."""
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    if not result or not result.get("rows"):
        return None
    return _proposal_from_row(result["rows"][0])


def get_project_client_id(project_id: int) -> Optional[int]:
    """Get the client_id for a project. Returns None if project not found."""
    proj_result = execute_query("SELECT client_id FROM projects WHERE id = ?", [project_id])
    if not proj_result or not proj_result.get("rows"):
        return None
    return int(_get_val(proj_result["rows"][0], 0) or 0)


def get_project_status(project_id: int) -> Optional[str]:
    """Get project ID and status. Returns status string or None."""
    result = execute_query("SELECT id, status FROM projects WHERE id = ?", [project_id])
    if not result or not result.get("rows"):
        return None
    return _safe_str(_get_val(result["rows"][0], 1))


def has_submitted_proposal(project_id: int, freelancer_id: int) -> bool:
    """Check if freelancer already has a non-draft proposal on a project."""
    result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ? AND is_draft = 0",
        [project_id, freelancer_id]
    )
    return bool(result and result.get("rows"))


def create_proposal(freelancer_id: int, proposal_data: dict) -> Optional[dict]:
    """Insert a submitted proposal. Returns the created proposal dict or None."""
    now = datetime.now(timezone.utc).isoformat()
    bid_amount = proposal_data.get("bid_amount") or (
        (proposal_data.get("estimated_hours", 0) or 0) * (proposal_data.get("hourly_rate", 0) or 0)
    )

    insert_result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status, is_draft,
           created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            proposal_data["project_id"],
            freelancer_id,
            proposal_data.get("cover_letter", ""),
            bid_amount,
            proposal_data.get("estimated_hours", 0),
            proposal_data.get("hourly_rate", 0),
            proposal_data.get("availability", ""),
            proposal_data.get("attachments", ""),
            "submitted",
            0,
            now,
            now
        ]
    )

    if not insert_result:
        return None

    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE freelancer_id = ? AND project_id = ? AND is_draft = 0
           ORDER BY id DESC LIMIT 1""",
        [freelancer_id, proposal_data["project_id"]]
    )

    if result and result.get("rows"):
        return _proposal_from_row(result["rows"][0])
    return None


_ALLOWED_PROPOSAL_COLUMNS = frozenset({
    "cover_letter", "bid_amount", "estimated_hours", "hourly_rate",
    "availability", "status", "attachments", "delivery_time",
})


def update_proposal(proposal_id: int, update_data: dict) -> Optional[dict]:
    """Update proposal fields. Returns updated proposal dict or None."""
    if not update_data:
        return get_proposal_raw(proposal_id)

    set_parts = []
    values: list = []
    for key, value in update_data.items():
        if key not in _ALLOWED_PROPOSAL_COLUMNS:
            raise ValueError(f"Invalid column name: {key}")
        set_parts.append(f"{key} = ?")
        values.append(value if value is not None else "")

    set_parts.append("updated_at = ?")
    values.append(datetime.now(timezone.utc).isoformat())
    values.append(proposal_id)

    execute_query(
        f"UPDATE proposals SET {', '.join(set_parts)} WHERE id = ?",
        values
    )

    return get_proposal_raw(proposal_id)


def get_proposal_for_delete(proposal_id: int) -> Optional[dict]:
    """Get proposal fields needed for delete validation."""
    result = execute_query(
        "SELECT id, freelancer_id, status FROM proposals WHERE id = ?",
        [proposal_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": int(_get_val(row, 0) or 0),
        "freelancer_id": int(_get_val(row, 1) or 0),
        "status": _safe_str(_get_val(row, 2))
    }


def delete_proposal(proposal_id: int) -> None:
    """Delete a proposal by ID."""
    execute_query("DELETE FROM proposals WHERE id = ?", [proposal_id])


def get_proposal_with_project_details(proposal_id: int) -> Optional[dict]:
    """Get proposal plus project details needed for acceptance."""
    result = execute_query(
        """SELECT id, project_id, freelancer_id, cover_letter, bid_amount,
           estimated_hours, hourly_rate, availability, attachments, status,
           is_draft, created_at, updated_at
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )
    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    proposal = _proposal_from_row(row)

    proj_result = execute_query(
        "SELECT client_id, title, description, budget_type, status FROM projects WHERE id = ?",
        [proposal["project_id"]]
    )
    if proj_result and proj_result.get("rows"):
        proj_row = proj_result["rows"][0]
        proposal["_project_client_id"] = int(_get_val(proj_row, 0) or 0)
        proposal["_project_title"] = _safe_str(_get_val(proj_row, 1)) or "Untitled Project"
        proposal["_project_description"] = _safe_str(_get_val(proj_row, 2)) or ""
        proposal["_project_budget_type"] = _safe_str(_get_val(proj_row, 3)) or "fixed"
        proposal["_project_status"] = _safe_str(_get_val(proj_row, 4)) or "open"
    else:
        proposal["_project_client_id"] = None

    return proposal


def accept_proposal(proposal_id: int, proposal: dict, client_id: int) -> Optional[dict]:
    """
    Accept a proposal: update statuses, reject others, create contract.
    Returns updated proposal dict.
    """
    now = datetime.now(timezone.utc).isoformat()
    project_id = proposal["project_id"]
    freelancer_id = proposal["freelancer_id"]
    bid_amount = proposal["bid_amount"]
    hourly_rate = proposal["hourly_rate"]
    project_title = proposal.get("_project_title", "Untitled Project")
    project_description = proposal.get("_project_description", "")

    # Accept proposal
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
        ["accepted", now, proposal_id]
    )

    # Update project status
    execute_query(
        "UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
        ["in_progress", now, project_id]
    )

    # Reject other proposals
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE project_id = ? AND id != ? AND status = ?",
        ["rejected", now, project_id, proposal_id, "submitted"]
    )

    # Create contract with tiered fee
    contract_amount = bid_amount if bid_amount > 0 else hourly_rate

    # Calculate tiered fee based on lifetime billing between client and freelancer
    lifetime_billing = 0
    try:
        lb_result = execute_query(
            """SELECT COALESCE(SUM(amount), 0) FROM payments
               WHERE from_user_id = ? AND to_user_id = ? AND status = 'completed'""",
            [client_id, freelancer_id]
        )
        if lb_result and lb_result.get("rows"):
            lifetime_billing = float(lb_result["rows"][0][0] or 0)
    except Exception:
        pass

    from app.api.v1.payments import calculate_tiered_fee
    fee_info = calculate_tiered_fee(contract_amount, lifetime_billing)
    platform_fee = fee_info["platform_fee"]

    start_date = now
    end_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    try:
        execute_query(
            """INSERT INTO contracts (project_id, freelancer_id, client_id, winning_bid_id,
               contract_type, amount, currency, contract_amount, platform_fee,
               status, start_date, end_date, description, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                project_id, freelancer_id, client_id, proposal_id,
                "fixed", contract_amount, "USD", contract_amount, platform_fee,
                "active", start_date, end_date,
                f"Contract for: {project_title}\n\n{project_description[:500] if project_description else 'N/A'}",
                now, now
            ]
        )
        logger.info(f"Contract created for project {project_id} on proposal {proposal_id} acceptance")
    except Exception as e:
        logger.error(f"Contract creation error on proposal {proposal_id}: {str(e)}")

    return get_proposal_raw(proposal_id)


def reject_proposal(proposal_id: int, reason: str = None) -> Optional[dict]:
    """Reject a proposal with optional reason. Returns updated proposal dict."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
        ["rejected", now, proposal_id]
    )

    if reason:
        # Store rejection reason in draft_data as JSON metadata
        existing_data = {}
        raw = execute_query("SELECT draft_data FROM proposals WHERE id = ?", [proposal_id])
        if raw and raw.get("rows") and raw["rows"][0][0]:
            try:
                existing_data = json.loads(raw["rows"][0][0])
            except (json.JSONDecodeError, TypeError):
                pass
        existing_data["rejection_reason"] = reason
        existing_data["rejected_at"] = now
        execute_query(
            "UPDATE proposals SET draft_data = ? WHERE id = ?",
            [json.dumps(existing_data), proposal_id]
        )

    return get_proposal_raw(proposal_id)


def shortlist_proposal(proposal_id: int) -> Optional[dict]:
    """Mark a proposal as shortlisted. Returns updated proposal dict."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
        ["shortlisted", now, proposal_id]
    )
    return get_proposal_raw(proposal_id)


def withdraw_proposal(proposal_id: int) -> Optional[dict]:
    """Freelancer withdraws their proposal. Returns updated proposal dict."""
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE proposals SET status = ?, updated_at = ? WHERE id = ?",
        ["withdrawn", now, proposal_id]
    )
    return get_proposal_raw(proposal_id)


def create_counter_offer(proposal_id: int, counter_data: dict) -> Optional[dict]:
    """
    Store counter-offer details in draft_data and update proposal.
    """
    now = datetime.now(timezone.utc).isoformat()

    # Load existing metadata
    existing_metadata = {}
    raw = execute_query("SELECT draft_data FROM proposals WHERE id = ?", [proposal_id])
    if raw and raw.get("rows") and raw["rows"][0][0]:
        try:
            existing_metadata = json.loads(raw["rows"][0][0])
        except (json.JSONDecodeError, TypeError):
            pass

    # Append counter-offer to history
    if "counter_offers" not in existing_metadata:
        existing_metadata["counter_offers"] = []
    existing_metadata["counter_offers"].append(counter_data)
    existing_metadata["latest_counter"] = counter_data

    execute_query(
        "UPDATE proposals SET draft_data = ?, status = ?, updated_at = ? WHERE id = ?",
        [json.dumps(existing_metadata), "submitted", now, proposal_id]
    )
    return get_proposal_raw(proposal_id)


def get_freelancer_proposal_stats(freelancer_id: int) -> dict:
    """
    Compute proposal statistics for a freelancer.
    """
    # Status breakdown
    result = execute_query(
        """SELECT status, COUNT(*) as cnt
           FROM proposals
           WHERE freelancer_id = ? AND is_draft = 0
           GROUP BY status""",
        [freelancer_id]
    )
    status_counts = {}
    total = 0
    for row in (result.get("rows", []) if result else []):
        s = _safe_str(_get_val(row, 0)) or "unknown"
        c = int(_get_val(row, 1) or 0)
        status_counts[s] = c
        total += c

    accepted = status_counts.get("accepted", 0)
    rejected = status_counts.get("rejected", 0)
    decided = accepted + rejected
    acceptance_rate = round((accepted / decided) * 100, 1) if decided > 0 else 0

    # Average bid
    avg_result = execute_query(
        """SELECT COALESCE(AVG(bid_amount), 0), COALESCE(AVG(hourly_rate), 0)
           FROM proposals
           WHERE freelancer_id = ? AND is_draft = 0 AND bid_amount > 0""",
        [freelancer_id]
    )
    avg_bid = 0
    avg_rate = 0
    if avg_result and avg_result.get("rows"):
        avg_bid = round(float(avg_result["rows"][0][0] or 0), 2)
        avg_rate = round(float(avg_result["rows"][0][1] or 0), 2)

    # Recent activity (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_result = execute_query(
        """SELECT COUNT(*) FROM proposals
           WHERE freelancer_id = ? AND is_draft = 0 AND created_at >= ?""",
        [freelancer_id, thirty_days_ago]
    )
    recent_count = 0
    if recent_result and recent_result.get("rows"):
        recent_count = int(recent_result["rows"][0][0] or 0)

    return {
        "freelancer_id": freelancer_id,
        "total_proposals": total,
        "status_breakdown": status_counts,
        "acceptance_rate": acceptance_rate,
        "average_bid_amount": avg_bid,
        "average_hourly_rate": avg_rate,
        "proposals_last_30_days": recent_count,
    }
