# @AI-HINT: Scope change service - business logic for contract modification requests and approvals
from app.db.turso_http import execute_query, parse_rows
from app.schemas.scope_change import ScopeChangeCreate, ScopeChangeStatus
from fastapi import HTTPException
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class ScopeChangeService:
    @staticmethod
    async def create_request(request: ScopeChangeCreate, user_id: int) -> Dict[str, Any]:
        """Create a scope change request for a contract."""
        # Verify contract exists and user is part of it
        result = execute_query(
            "SELECT id, client_id, freelancer_id, amount, end_date FROM contracts WHERE id = ?",
            [request.contract_id]
        )
        contracts = parse_rows(result)
        if not contracts:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract = contracts[0]
        if contract["client_id"] != user_id and contract["freelancer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this contract")

        now = datetime.now(timezone.utc).isoformat()
        new_deadline_str = request.new_deadline.isoformat() if request.new_deadline else None
        old_deadline_str = contract.get("end_date")

        result = execute_query(
            """INSERT INTO scope_change_requests 
               (contract_id, requested_by, title, description, reason, status,
                old_amount, old_deadline, new_amount, new_deadline, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               RETURNING *""",
            [request.contract_id, user_id, request.title, request.description,
             request.reason, ScopeChangeStatus.PENDING.value,
             contract.get("amount"), old_deadline_str,
             request.new_amount, new_deadline_str, now, now]
        )
        rows = parse_rows(result)
        return rows[0] if rows else {}

    @staticmethod
    async def get_request(request_id: int) -> Dict[str, Any]:
        """Get a single scope change request by ID."""
        result = execute_query(
            "SELECT * FROM scope_change_requests WHERE id = ?", [request_id]
        )
        rows = parse_rows(result)
        if not rows:
            raise HTTPException(status_code=404, detail="Scope change request not found")
        return rows[0]

    @staticmethod
    async def get_by_contract(contract_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all scope change requests for a contract."""
        result = execute_query(
            """SELECT * FROM scope_change_requests 
               WHERE contract_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            [contract_id, limit, skip]
        )
        return parse_rows(result)

    @staticmethod
    async def update_status(request_id: int, status_update: ScopeChangeStatus, user_id: int) -> Dict[str, Any]:
        """Update scope change request status (approve/reject/cancel)."""
        request = await ScopeChangeService.get_request(request_id)
        
        # Get the contract
        result = execute_query(
            "SELECT id, client_id, freelancer_id FROM contracts WHERE id = ?",
            [request["contract_id"]]
        )
        contracts = parse_rows(result)
        if not contracts:
            raise HTTPException(status_code=404, detail="Contract not found")
        contract = contracts[0]

        # Verify authorization (only the OTHER party can approve)
        if status_update == ScopeChangeStatus.APPROVED:
            if request["requested_by"] == user_id:
                raise HTTPException(status_code=400, detail="Cannot approve your own request")
            if contract["client_id"] != user_id and contract["freelancer_id"] != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

        # If cancelling, only requester can cancel
        if status_update == ScopeChangeStatus.CANCELLED:
            if request["requested_by"] != user_id:
                raise HTTPException(status_code=403, detail="Only requester can cancel")

        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            "UPDATE scope_change_requests SET status = ?, resolved_at = ?, updated_at = ? WHERE id = ?",
            [status_update.value, now, now, request_id]
        )

        # If approved, update the contract
        if status_update == ScopeChangeStatus.APPROVED:
            updates = []
            params = []
            if request.get("new_amount"):
                updates.append("amount = ?")
                params.append(request["new_amount"])
            if request.get("new_deadline"):
                updates.append("end_date = ?")
                params.append(request["new_deadline"])
            if updates:
                params.append(request["contract_id"])
                execute_query(
                    f"UPDATE contracts SET {', '.join(updates)} WHERE id = ?",
                    params
                )

        return await ScopeChangeService.get_request(request_id)
