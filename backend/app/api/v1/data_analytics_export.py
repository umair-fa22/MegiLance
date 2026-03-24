# @AI-HINT: Data analytics export API - BI reports and data exports (Turso-backed)
import logging
import json
import os
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from enum import Enum
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query
from app.core.security import get_current_active_user
from app.services.db_utils import get_user_role, paginate_params

router = APIRouter(prefix="/data-export")

EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

# Static column definitions per data type
COLUMNS_MAP = {
    "projects": ["id", "title", "description", "status", "budget", "created_at", "deadline", "client_id", "freelancer_id"],
    "users": ["id", "email", "name", "role", "created_at", "is_verified", "is_active"],
    "payments": ["id", "amount", "currency", "status", "payment_method", "created_at"],
    "contracts": ["id", "project_id", "client_id", "freelancer_id", "amount", "status", "start_date", "end_date"],
    "reviews": ["id", "rating", "comment", "reviewer_id", "reviewee_id", "project_id", "created_at"],
}

# Allowed table names (whitelist for SQL safety)
ALLOWED_TABLES = {"projects", "users", "payments", "contracts", "reviews"}


def _uid(cu):
    return cu.id if hasattr(cu, "id") else cu.get("user_id")


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_dict(row, cols):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in cols]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


@router.post("/create")
async def create_export(
    name: str,
    data_type: str = Query(..., enum=["users", "projects", "contracts", "payments", "reviews"]),
    export_format: str = Query("csv", alias="format", enum=["csv", "json"]),
    filters: Optional[str] = None,
    current_user=Depends(get_current_active_user),
):
    """Create a new data export and generate the file."""
    uid = _uid(current_user)
    admin_only = {"users", "payments"}
    if data_type in admin_only and get_user_role(current_user) != "admin":
        raise HTTPException(status_code=403, detail=f"Admin access required to export {data_type} data")
    if data_type not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Invalid data type")

    now = datetime.now(timezone.utc).isoformat()
    # Insert pending record
    execute_query(
        "INSERT INTO data_exports (user_id, export_type, format, status, filters, started_at, created_at) VALUES (?, ?, ?, 'processing', ?, ?, ?)",
        [uid, data_type, export_format, filters or "", now, now]
    )
    id_res = execute_query("SELECT last_insert_rowid()")
    export_id = _val(id_res["rows"][0][0])

    # Query actual data
    cols = COLUMNS_MAP.get(data_type, ["id"])
    safe_cols = ", ".join(c for c in cols if c.isalnum() or c == "_")
    result = execute_query(f"SELECT {safe_cols} FROM {data_type} LIMIT 10000")
    db_cols = result.get("columns", result.get("cols", []))
    rows = [_row_dict(r, db_cols) for r in result.get("rows", [])]

    # Save file
    filename = f"export_{export_id}.{export_format}"
    filepath = os.path.join(EXPORT_DIR, filename)
    if export_format == "json":
        with open(filepath, "w") as f:
            json.dump(rows, f, default=str)
    else:
        import csv
        with open(filepath, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=db_cols if db_cols else cols)
            writer.writeheader()
            writer.writerows(rows)

    file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
    completed = datetime.now(timezone.utc).isoformat()
    execute_query(
        "UPDATE data_exports SET status='completed', file_path=?, file_size=?, row_count=?, completed_at=? WHERE id=?",
        [filepath, file_size, len(rows), completed, export_id]
    )
    return {
        "id": export_id, "user_id": uid, "name": name, "data_type": data_type,
        "format": export_format, "status": "completed", "file_size": file_size,
        "records_count": len(rows), "created_at": now, "completed_at": completed,
    }


@router.get("/list")
async def list_exports(
    export_status: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
):
    """List user's exports."""
    uid = _uid(current_user)
    offset, limit = paginate_params(page, page_size)
    conditions = ["user_id = ?"]
    params = [uid]
    if export_status:
        conditions.append("status = ?")
        params.append(export_status)
    where = " AND ".join(conditions)
    params.extend([limit, offset])
    result = execute_query(
        f"SELECT id, user_id, export_type, format, status, filters, file_path, file_size, row_count, error_message, started_at, completed_at, created_at FROM data_exports WHERE {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params,
    )
    cols = result.get("columns", result.get("cols", []))
    return [_row_dict(r, cols) for r in result.get("rows", [])]


@router.get("/templates")
async def get_export_templates(data_type: Optional[str] = None, current_user=Depends(get_current_active_user)):
    """Get available export templates (static schema definitions)."""
    templates = [
        {"id": "tpl-projects", "name": "Projects Export", "description": "Export all project data", "data_type": "projects", "columns": COLUMNS_MAP["projects"], "default_format": "csv"},
        {"id": "tpl-users", "name": "Users Export", "description": "Export user data (admin)", "data_type": "users", "columns": COLUMNS_MAP["users"], "default_format": "csv"},
        {"id": "tpl-payments", "name": "Payments Export", "description": "Export payment transactions (admin)", "data_type": "payments", "columns": COLUMNS_MAP["payments"], "default_format": "csv"},
        {"id": "tpl-contracts", "name": "Contracts Export", "description": "Export contract data", "data_type": "contracts", "columns": COLUMNS_MAP["contracts"], "default_format": "csv"},
        {"id": "tpl-reviews", "name": "Reviews Export", "description": "Export review data", "data_type": "reviews", "columns": COLUMNS_MAP["reviews"], "default_format": "csv"},
    ]
    if data_type:
        templates = [t for t in templates if t["data_type"] == data_type]
    return templates


@router.get("/available-columns/{data_type}")
async def get_available_columns(data_type: str, current_user=Depends(get_current_active_user)):
    """Get available columns for a data type."""
    return {"data_type": data_type, "columns": COLUMNS_MAP.get(data_type, [])}


@router.get("/storage-usage")
async def get_storage_usage(current_user=Depends(get_current_active_user)):
    """Get export storage usage from real data."""
    uid = _uid(current_user)
    result = execute_query(
        "SELECT COUNT(*), COALESCE(SUM(file_size), 0) FROM data_exports WHERE user_id = ?", [uid]
    )
    row = result["rows"][0] if result.get("rows") else [0, 0]
    count = _val(row[0]) or 0
    used = _val(row[1]) or 0
    limit_bytes = 1073741824  # 1 GB
    return {
        "used_bytes": used,
        "used_human": f"{used / 1048576:.1f} MB",
        "limit_bytes": limit_bytes,
        "limit_human": "1 GB",
        "percentage": round((used / limit_bytes) * 100, 2) if limit_bytes else 0,
        "exports_count": count,
    }


@router.post("/preview")
async def preview_export(
    data_type: str,
    columns: List[str],
    filters: Optional[dict] = None,
    limit: int = Query(10, ge=1, le=100),
    current_user=Depends(get_current_active_user),
):
    """Preview export data with real rows."""
    if data_type not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Invalid data type")
    valid_cols = COLUMNS_MAP.get(data_type, [])
    safe_cols = [c for c in columns if c in valid_cols]
    if not safe_cols:
        safe_cols = valid_cols[:5] if valid_cols else ["id"]
    col_str = ", ".join(safe_cols)
    result = execute_query(f"SELECT {col_str} FROM {data_type} LIMIT ?", [limit])
    db_cols = result.get("columns", result.get("cols", []))
    rows = [_row_dict(r, db_cols) for r in result.get("rows", [])]
    count_res = execute_query(f"SELECT COUNT(*) FROM {data_type}")
    total = _val(count_res["rows"][0][0]) if count_res.get("rows") else 0
    return {"data_type": data_type, "columns": safe_cols, "preview_rows": rows, "total_records": total}


@router.get("/{export_id}")
async def get_export(export_id: int, current_user=Depends(get_current_active_user)):
    """Get export details."""
    uid = _uid(current_user)
    result = execute_query(
        "SELECT id, user_id, export_type, format, status, filters, file_path, file_size, row_count, error_message, started_at, completed_at, created_at FROM data_exports WHERE id = ? AND user_id = ?",
        [export_id, uid],
    )
    cols = result.get("columns", result.get("cols", []))
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Export not found")
    return _row_dict(result["rows"][0], cols)


@router.get("/{export_id}/download")
async def download_export(export_id: int, current_user=Depends(get_current_active_user)):
    """Get download info for export."""
    uid = _uid(current_user)
    result = execute_query("SELECT file_path, format FROM data_exports WHERE id = ? AND user_id = ? AND status = 'completed'", [export_id, uid])
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Export not found or not ready")
    file_path = _val(result["rows"][0][0])
    return {"export_id": export_id, "file_path": file_path, "expires_in": 3600}


@router.delete("/{export_id}")
async def delete_export(export_id: int, current_user=Depends(get_current_active_user)):
    """Delete an export and its file."""
    uid = _uid(current_user)
    result = execute_query("SELECT file_path FROM data_exports WHERE id = ? AND user_id = ?", [export_id, uid])
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Export not found")
    file_path = _val(result["rows"][0][0])
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
    execute_query("DELETE FROM data_exports WHERE id = ?", [export_id])
    return {"message": "Export deleted", "id": export_id}

