# @AI-HINT: Custom workflow statuses - Allow users to define custom project/task statuses (Turso-backed)
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from enum import Enum

from app.db.turso_http import execute_query
from app.core.security import get_current_active_user

router = APIRouter(prefix="/custom-statuses")


class EntityType(str, Enum):
    PROJECT = "project"
    PROPOSAL = "proposal"
    CONTRACT = "contract"
    MILESTONE = "milestone"
    TASK = "task"


class CustomStatusCreate(BaseModel):
    name: str
    entity_type: EntityType
    color: str = "#6B7280"
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0


class CustomStatusUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


def _uid(cu) -> int:
    return cu.id if hasattr(cu, "id") else cu.get("user_id") or cu.get("id")


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_dict(row, cols):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in cols]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


COLS = "id, user_id, entity_type, name, color, icon, description, sort_order, is_active, created_at, updated_at"


@router.get("", response_model=list)
async def list_custom_statuses(
    entity_type: Optional[EntityType] = None,
    current_user=Depends(get_current_active_user),
):
    """List all custom statuses for the current user."""
    uid = _uid(current_user)
    if entity_type:
        result = execute_query(
            f"SELECT {COLS} FROM custom_statuses WHERE user_id = ? AND entity_type = ? AND is_active = 1 ORDER BY sort_order",
            [uid, entity_type.value]
        )
    else:
        result = execute_query(
            f"SELECT {COLS} FROM custom_statuses WHERE user_id = ? AND is_active = 1 ORDER BY sort_order",
            [uid]
        )
    cols = result.get("columns", result.get("cols", []))
    return [_row_dict(row, cols) for row in result.get("rows", [])]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_custom_status(
    status_data: CustomStatusCreate,
    current_user=Depends(get_current_active_user),
):
    """Create a new custom status."""
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO custom_statuses (user_id, entity_type, name, color, icon, description, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
        [uid, status_data.entity_type.value, status_data.name, status_data.color, status_data.icon, status_data.description, status_data.sort_order, now, now]
    )
    inserted = execute_query("SELECT last_insert_rowid()")
    new_id = _val(inserted["rows"][0][0]) if inserted.get("rows") else None
    return {
        "id": new_id, "user_id": uid, "entity_type": status_data.entity_type.value,
        "name": status_data.name, "color": status_data.color, "icon": status_data.icon,
        "description": status_data.description, "sort_order": status_data.sort_order,
        "is_active": True, "created_at": now, "updated_at": now,
    }


@router.get("/{status_id}")
async def get_custom_status(status_id: int, current_user=Depends(get_current_active_user)):
    """Get a specific custom status."""
    uid = _uid(current_user)
    result = execute_query(f"SELECT {COLS} FROM custom_statuses WHERE id = ?", [status_id])
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Custom status not found")
    cols = result.get("columns", result.get("cols", []))
    s = _row_dict(result["rows"][0], cols)
    if s["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not authorized to access this status")
    return s


@router.put("/{status_id}")
async def update_custom_status(
    status_id: int,
    status_data: CustomStatusUpdate,
    current_user=Depends(get_current_active_user),
):
    """Update a custom status."""
    uid = _uid(current_user)
    existing = execute_query(f"SELECT {COLS} FROM custom_statuses WHERE id = ?", [status_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Custom status not found")
    cols = existing.get("columns", existing.get("cols", []))
    old = _row_dict(existing["rows"][0], cols)
    if old["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not authorized to modify this status")
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE custom_statuses SET name=?, color=?, icon=?, description=?, sort_order=?, updated_at=? WHERE id=?",
        [
            status_data.name or old["name"],
            status_data.color or old["color"],
            status_data.icon if status_data.icon is not None else old.get("icon"),
            status_data.description if status_data.description is not None else old.get("description"),
            status_data.sort_order if status_data.sort_order is not None else old["sort_order"],
            now, status_id,
        ]
    )
    return {"id": status_id, "updated_at": now, "message": "Status updated"}


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_status(status_id: int, current_user=Depends(get_current_active_user)):
    """Delete a custom status."""
    uid = _uid(current_user)
    existing = execute_query("SELECT user_id FROM custom_statuses WHERE id = ?", [status_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Custom status not found")
    cols = existing.get("columns", existing.get("cols", []))
    if _row_dict(existing["rows"][0], cols)["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not authorized to delete this status")
    execute_query("DELETE FROM custom_statuses WHERE id = ?", [status_id])
    return None


@router.post("/reorder", response_model=list)
async def reorder_statuses(
    entity_type: EntityType,
    status_ids: List[int],
    current_user=Depends(get_current_active_user),
):
    """Reorder custom statuses."""
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    for idx, sid in enumerate(status_ids):
        execute_query(
            "UPDATE custom_statuses SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            [idx, now, sid, uid]
        )
    result = execute_query(
        f"SELECT {COLS} FROM custom_statuses WHERE user_id = ? AND entity_type = ? AND is_active = 1 ORDER BY sort_order",
        [uid, entity_type.value]
    )
    cols = result.get("columns", result.get("cols", []))
    return [_row_dict(row, cols) for row in result.get("rows", [])]

