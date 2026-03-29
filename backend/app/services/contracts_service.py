# @AI-HINT: Service layer for contract CRUD operations - all DB access via Turso HTTP
"""Contracts Service - Data access layer for contract management."""

import logging
from typing import Optional, List

from app.db.turso_http import execute_query, parse_date, parse_rows
from app.services.db_utils import get_val as _get_val, safe_str as _safe_str

logger = logging.getLogger(__name__)

# SQL for selecting contract with joins
CONTRACT_SELECT_SQL = """
    SELECT 
        c.id, c.project_id, c.freelancer_id, c.client_id, c.amount as total_amount,
        c.contract_type, c.currency, c.hourly_rate, c.retainer_amount, c.retainer_frequency,
        c.status,
        c.start_date, c.end_date, c.description, c.milestones, c.terms, c.created_at, c.updated_at,
        p.title as job_title,
        u.name as client_name
    FROM contracts c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN users u ON c.client_id = u.id
"""


def contract_from_row(row: list) -> dict:
    """Convert Turso row to contract dict."""
    return {
        "id": _safe_str(_get_val(row, 0)),
        "project_id": int(_get_val(row, 1) or 0),
        "freelancer_id": int(_get_val(row, 2) or 0),
        "client_id": int(_get_val(row, 3) or 0),
        "amount": float(_get_val(row, 4) or 0),
        "contract_amount": float(_get_val(row, 4) or 0),
        "contract_type": _safe_str(_get_val(row, 5)),
        "currency": _safe_str(_get_val(row, 6)),
        "hourly_rate": float(_get_val(row, 7) or 0) if _get_val(row, 7) else None,
        "retainer_amount": float(_get_val(row, 8) or 0) if _get_val(row, 8) else None,
        "retainer_frequency": _safe_str(_get_val(row, 9)),
        "status": _safe_str(_get_val(row, 10)),
        "start_date": parse_date(_get_val(row, 11)),
        "end_date": parse_date(_get_val(row, 12)),
        "description": _safe_str(_get_val(row, 13)),
        "milestones": _safe_str(_get_val(row, 14)),
        "terms": _safe_str(_get_val(row, 15)),
        "created_at": parse_date(_get_val(row, 16)),
        "updated_at": parse_date(_get_val(row, 17)),
        "job_title": _safe_str(_get_val(row, 18)),
        "client_name": _safe_str(_get_val(row, 19))
    }


def query_user_contracts(user_id: int, status: Optional[str], limit: int, offset: int) -> List[dict]:
    """List contracts for a user with optional status filter."""
    where_sql = "WHERE (c.client_id = ? OR c.freelancer_id = ?)"
    params = [user_id, user_id]

    if status:
        where_sql += " AND c.status = ?"
        params.append(status.lower())

    params.extend([limit, offset])

    result = execute_query(
        f"{CONTRACT_SELECT_SQL} {where_sql} ORDER BY c.created_at DESC LIMIT ? OFFSET ?",
        params
    )

    contracts = []
    if result and result.get("rows"):
        for row in result["rows"]:
            contracts.append(contract_from_row(row))
    return contracts


def fetch_contract_with_joins(contract_id: str) -> Optional[dict]:
    """Fetch a single contract with project/user joins. Returns raw row or None."""
    result = execute_query(
        f"{CONTRACT_SELECT_SQL} WHERE c.id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None
    return result["rows"][0]


def get_contract_parties(raw_row: list) -> tuple:
    """Extract client_id and freelancer_id from a raw contract row."""
    client_id = int(_get_val(raw_row, 3) or 0)
    freelancer_id = int(_get_val(raw_row, 2) or 0)
    return client_id, freelancer_id


def fetch_user_for_contract(user_id: int) -> Optional[dict]:
    """Check if a user exists and get their type and active status."""
    result = execute_query(
        "SELECT id, user_type, is_active FROM users WHERE id = ?",
        [user_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": _get_val(row, 0),
        "user_type": _safe_str(_get_val(row, 1)),
        "is_active": _get_val(row, 2)
    }


def fetch_project_for_contract(project_id: int) -> Optional[dict]:
    """Fetch project for contract validation."""
    result = execute_query(
        "SELECT id, client_id, title FROM projects WHERE id = ?",
        [project_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "id": _get_val(row, 0),
        "client_id": int(_get_val(row, 1) or 0),
        "title": _safe_str(_get_val(row, 2))
    }


def fetch_proposal_status(project_id: int, freelancer_id: int) -> Optional[str]:
    """Get proposal status for project/freelancer pair."""
    result = execute_query(
        "SELECT id, status FROM proposals WHERE project_id = ? AND freelancer_id = ?",
        [project_id, freelancer_id]
    )
    if not result or not result.get("rows"):
        return None
    return _safe_str(_get_val(result["rows"][0], 1))


def has_active_contract(project_id: int, freelancer_id: int) -> bool:
    """Check if an active/pending contract already exists."""
    result = execute_query(
        """SELECT id FROM contracts 
           WHERE project_id = ? AND freelancer_id = ? AND status IN ('pending', 'active')""",
        [project_id, freelancer_id]
    )
    return bool(result and result.get("rows"))


def insert_project(title: str, description: str, client_id: int, rate: float,
                   rate_type: str, now: str) -> Optional[int]:
    """Insert a project for direct hire flow. Returns project_id or None."""
    result = execute_query(
        """INSERT INTO projects (title, description, client_id, budget_min, budget_max, 
           budget_type, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [title, description, client_id, rate, rate, rate_type, "in_progress", now, now]
    )
    if not result:
        return None
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    if id_result and id_result.get("rows"):
        rows = parse_rows(id_result)
        return int(rows[0]["id"]) if rows else None
    return None


def insert_proposal(project_id: int, freelancer_id: int, rate: float,
                    rate_type: str, now: str) -> bool:
    """Insert an accepted proposal for direct hire flow."""
    result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, estimated_hours, 
           hourly_rate, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            project_id, freelancer_id, "Direct Hire", 0,
            rate if rate_type == 'hourly' else 0,
            "accepted", now, now
        ]
    )
    return bool(result)


def insert_contract(params: List) -> Optional[int]:
    """Insert a contract record. Returns the new contract ID or None on failure."""
    result = execute_query(
        """INSERT INTO contracts (project_id, freelancer_id, client_id, amount, 
           contract_type, currency, hourly_rate, retainer_amount, retainer_frequency,
           contract_amount, platform_fee, status, start_date, end_date, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        params
    )
    if not result:
        return None
    # Retrieve the auto-generated ID
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    if id_result and id_result.get("rows"):
        rows = parse_rows(id_result)
        if rows:
            return int(rows[0].get("id", 0)) or None
    return None


def insert_contract_full(params: List) -> bool:
    """Insert a contract record with milestones and terms."""
    result = execute_query(
        """INSERT INTO contracts (project_id, freelancer_id, client_id, amount, 
           contract_type, currency, hourly_rate, retainer_amount, retainer_frequency,
           contract_amount, platform_fee, status, start_date, end_date, description, milestones, terms, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        params
    )
    return bool(result)


def fetch_contract_for_update(contract_id: str) -> Optional[dict]:
    """Fetch contract data needed for update validation."""
    result = execute_query(
        """SELECT id, project_id, freelancer_id, client_id, amount, status,
           start_date, end_date, description, milestones, terms, created_at, updated_at
           FROM contracts WHERE id = ?""",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "client_id": int(_get_val(row, 3) or 0),
        "freelancer_id": int(_get_val(row, 2) or 0),
        "status": _safe_str(_get_val(row, 5))
    }


_ALLOWED_CONTRACT_SET_PARTS = frozenset({
    "title", "description", "status", "rate", "rate_type",
    "amount", "hourly_rate", "retainer_amount", "retainer_frequency",
    "milestones", "start_date", "end_date", "terms", "updated_at",
})


def update_contract_fields(contract_id: str, set_parts: List[str], values: List) -> None:
    """Update contract fields.

    ``set_parts`` must contain only ``column = ?`` entries whose column is
    in the allowlist.
    """
    for part in set_parts:
        col = part.split("=", 1)[0].strip()
        if col not in _ALLOWED_CONTRACT_SET_PARTS:
            raise ValueError(f"Invalid column in SET clause: {col}")
    execute_query(
        f"UPDATE contracts SET {', '.join(set_parts)} WHERE id = ?",
        values
    )


def fetch_contract_status(contract_id: str) -> Optional[dict]:
    """Fetch contract status and client_id for delete validation."""
    result = execute_query(
        "SELECT id, client_id, status FROM contracts WHERE id = ?",
        [contract_id]
    )
    if not result or not result.get("rows"):
        return None
    row = result["rows"][0]
    return {
        "client_id": int(_get_val(row, 1) or 0),
        "status": _safe_str(_get_val(row, 2))
    }


def cancel_contract(contract_id: str, now: str) -> None:
    """Soft-delete a contract by setting status to cancelled."""
    execute_query(
        "UPDATE contracts SET status = 'cancelled', updated_at = ? WHERE id = ?",
        [now, contract_id]
    )
