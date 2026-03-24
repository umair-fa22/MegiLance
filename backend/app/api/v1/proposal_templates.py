# @AI-HINT: Proposal templates API - Reusable proposal templates (Turso-backed)
import logging
import json
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows, to_int
from app.core.security import get_current_active_user
from app.services.db_utils import paginate_params

router = APIRouter(prefix="/proposal-templates")


class CreateTemplateBody(BaseModel):
    name: str
    content: str
    description: Optional[str] = None
    category: str = "general"
    tags: Optional[List[str]] = None
    is_public: bool = False


class UpdateTemplateBody(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class TemplateVariable(BaseModel):
    name: str
    description: str
    default_value: Optional[str] = None


def _uid(cu) -> int:
    return cu.id if hasattr(cu, "id") else cu.get("user_id") or cu.get("id")


def _is_public(val) -> bool:
    """Convert Turso boolean (0/1 as string or int) to Python bool."""
    if isinstance(val, bool):
        return val
    return str(val) in ("1", "True", "true")


def _normalize(row: dict) -> dict:
    """Normalize a parsed row: parse tags JSON, cast types."""
    # Parse tags
    tags = row.get("tags")
    if isinstance(tags, str):
        try:
            row["tags"] = json.loads(tags)
        except (json.JSONDecodeError, TypeError):
            row["tags"] = []
    elif tags is None:
        row["tags"] = []
    # Cast integer fields
    for int_field in ("id", "user_id", "use_count"):
        if int_field in row and row[int_field] is not None:
            row[int_field] = to_int(row[int_field])
    # Cast boolean
    if "is_public" in row:
        row["is_public"] = _is_public(row["is_public"])
    # Cast float
    if "success_rate" in row and row["success_rate"] is not None:
        try:
            row["success_rate"] = float(row["success_rate"])
        except (ValueError, TypeError):
            row["success_rate"] = 0.0
    return row


def _parse_one(result) -> Optional[dict]:
    """Parse a single row from execute_query result, or None."""
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return _normalize(rows[0]) if rows else None


def _parse_all(result) -> list:
    """Parse all rows from execute_query result."""
    if not result or not result.get("rows"):
        return []
    return [_normalize(r) for r in parse_rows(result)]


COLS = "id, user_id, name, content, description, category, tags, is_public, use_count, success_rate, created_at, updated_at"


@router.get("/variables", response_model=List[TemplateVariable])
async def get_available_variables(current_user=Depends(get_current_active_user)):
    """Get available template variables (static config)."""
    return [
        TemplateVariable(name="client_name", description="Client's full name"),
        TemplateVariable(name="project_title", description="Project title"),
        TemplateVariable(name="project_type", description="Type of project"),
        TemplateVariable(name="budget", description="Project budget"),
        TemplateVariable(name="deadline", description="Project deadline"),
        TemplateVariable(name="my_name", description="Your full name"),
        TemplateVariable(name="my_title", description="Your professional title"),
        TemplateVariable(name="hourly_rate", description="Your hourly rate"),
    ]


@router.get("/analytics")
async def get_template_analytics(current_user=Depends(get_current_active_user)):
    """Get template usage analytics from real data."""
    uid = _uid(current_user)
    total = execute_query("SELECT COUNT(*) as cnt, COALESCE(SUM(use_count), 0) as total_uses FROM proposal_templates WHERE user_id = ?", [uid])
    total_row = _parse_one(total)
    total_templates = to_int(total_row["cnt"]) if total_row else 0
    total_uses = to_int(total_row["total_uses"]) if total_row else 0
    most_used = execute_query(
        "SELECT id, name, use_count FROM proposal_templates WHERE user_id = ? ORDER BY use_count DESC LIMIT 1",
        [uid]
    )
    most_used_template = None
    mu = _parse_one(most_used)
    if mu:
        most_used_template = {"id": to_int(mu["id"]), "name": mu["name"], "uses": to_int(mu["use_count"])}
    return {"total_templates": total_templates, "total_uses": total_uses, "most_used_template": most_used_template}


@router.get("/public/browse", response_model=list)
async def browse_public_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
):
    """Browse public templates."""
    offset, limit = paginate_params(page, page_size)
    conditions = ["is_public = 1"]
    params: list = []
    if category:
        conditions.append("category = ?")
        params.append(category)
    if search:
        conditions.append("(name LIKE ? OR description LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    where = " AND ".join(conditions)
    params.extend([limit, offset])
    result = execute_query(
        f"SELECT {COLS} FROM proposal_templates WHERE {where} ORDER BY use_count DESC LIMIT ? OFFSET ?",
        params
    )
    return _parse_all(result)


@router.get("/", response_model=list)
async def get_my_templates(
    tag: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
):
    """Get user's proposal templates."""
    uid = _uid(current_user)
    offset, limit = paginate_params(page, page_size)
    if tag:
        result = execute_query(
            f"SELECT {COLS} FROM proposal_templates WHERE user_id = ? AND tags LIKE ? ORDER BY use_count DESC LIMIT ? OFFSET ?",
            [uid, f"%{tag}%", limit, offset]
        )
    else:
        result = execute_query(
            f"SELECT {COLS} FROM proposal_templates WHERE user_id = ? ORDER BY use_count DESC LIMIT ? OFFSET ?",
            [uid, limit, offset]
        )
    return _parse_all(result)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_template(body: CreateTemplateBody, current_user=Depends(get_current_active_user)):
    """Create a proposal template."""
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    tags_json = json.dumps(body.tags) if body.tags else "[]"
    result = execute_query(
        "INSERT INTO proposal_templates (user_id, name, content, description, category, tags, is_public, use_count, success_rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0.0, ?, ?) RETURNING id",
        [uid, body.name, body.content, body.description, body.category, tags_json, 1 if body.is_public else 0, now, now]
    )
    row = _parse_one(result)
    new_id = to_int(row["id"]) if row else None
    return {
        "id": new_id, "user_id": uid, "name": body.name, "content": body.content,
        "description": body.description, "category": body.category, "tags": body.tags or [],
        "is_public": body.is_public, "use_count": 0, "created_at": now,
    }


@router.get("/{template_id}")
async def get_template(template_id: int, current_user=Depends(get_current_active_user)):
    """Get a specific template."""
    uid = _uid(current_user)
    result = execute_query(f"SELECT {COLS} FROM proposal_templates WHERE id = ?", [template_id])
    t = _parse_one(result)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if t["user_id"] != uid and not t["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return t


@router.put("/{template_id}")
async def update_template(template_id: int, body: UpdateTemplateBody, current_user=Depends(get_current_active_user)):
    """Update a template."""
    uid = _uid(current_user)
    existing = execute_query(f"SELECT {COLS} FROM proposal_templates WHERE id = ?", [template_id])
    old = _parse_one(existing)
    if not old:
        raise HTTPException(status_code=404, detail="Template not found")
    if old["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Not your template")
    now = datetime.now(timezone.utc).isoformat()
    tags_json = json.dumps(body.tags) if body.tags is not None else json.dumps(old.get("tags", []))
    new_is_public = body.is_public if body.is_public is not None else old.get("is_public", False)
    execute_query(
        "UPDATE proposal_templates SET name=?, content=?, description=?, category=?, tags=?, is_public=?, updated_at=? WHERE id=?",
        [
            body.name or old["name"], body.content or old["content"],
            body.description if body.description is not None else old.get("description"),
            body.category or old.get("category", "general"), tags_json,
            1 if new_is_public else 0,
            now, template_id
        ]
    )
    return {"id": template_id, "updated_at": now, "message": "Template updated"}


@router.delete("/{template_id}")
async def delete_template(template_id: int, current_user=Depends(get_current_active_user)):
    """Delete a template."""
    uid = _uid(current_user)
    existing = execute_query("SELECT user_id FROM proposal_templates WHERE id = ?", [template_id])
    owner = _parse_one(existing)
    if not owner:
        raise HTTPException(status_code=404, detail="Template not found")
    if to_int(owner["user_id"]) != uid:
        raise HTTPException(status_code=403, detail="Not your template")
    execute_query("DELETE FROM proposal_templates WHERE id = ?", [template_id])
    return {"message": "Template deleted"}


@router.post("/{template_id}/duplicate", status_code=status.HTTP_201_CREATED)
async def duplicate_template(template_id: int, new_name: Optional[str] = None, current_user=Depends(get_current_active_user)):
    """Duplicate a template."""
    uid = _uid(current_user)
    result = execute_query(f"SELECT {COLS} FROM proposal_templates WHERE id = ?", [template_id])
    src = _parse_one(result)
    if not src:
        raise HTTPException(status_code=404, detail="Template not found")
    if src["user_id"] != uid and not src["is_public"]:
        raise HTTPException(status_code=403, detail="Access denied")
    now = datetime.now(timezone.utc).isoformat()
    dup_name = new_name or f"Copy of {src['name']}"
    tags_json = json.dumps(src.get("tags", []))
    ins = execute_query(
        "INSERT INTO proposal_templates (user_id, name, content, description, category, tags, is_public, use_count, success_rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0.0, ?, ?) RETURNING id",
        [uid, dup_name, src["content"], src.get("description"), src.get("category", "general"), tags_json, now, now]
    )
    row = _parse_one(ins)
    new_id = to_int(row["id"]) if row else None
    return {"id": new_id, "name": dup_name, "message": "Template duplicated"}


@router.post("/public/{template_id}/use")
async def use_public_template(template_id: int, current_user=Depends(get_current_active_user)):
    """Copy a public template to user's templates."""
    result = execute_query(f"SELECT {COLS} FROM proposal_templates WHERE id = ? AND is_public = 1", [template_id])
    src = _parse_one(result)
    if not src:
        raise HTTPException(status_code=404, detail="Public template not found")
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    tags_json = json.dumps(src.get("tags", []))
    ins = execute_query(
        "INSERT INTO proposal_templates (user_id, name, content, description, category, tags, is_public, use_count, success_rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0.0, ?, ?) RETURNING id",
        [uid, src["name"], src["content"], src.get("description"), src.get("category", "general"), tags_json, now, now]
    )
    # Increment use_count on source
    execute_query("UPDATE proposal_templates SET use_count = use_count + 1 WHERE id = ?", [template_id])
    row = _parse_one(ins)
    new_id = to_int(row["id"]) if row else None
    return {"new_template_id": new_id, "message": "Template copied to your templates"}


@router.post("/{template_id}/preview")
async def preview_template(template_id: int, variables: dict, current_user=Depends(get_current_active_user)):
    """Preview template with variables replaced."""
    uid = _uid(current_user)
    result = execute_query("SELECT content, user_id, is_public FROM proposal_templates WHERE id = ?", [template_id])
    t = _parse_one(result)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if to_int(t["user_id"]) != uid and not _is_public(t.get("is_public")):
        raise HTTPException(status_code=403, detail="Access denied")
    content = t.get("content") or ""
    missing = []
    for match in re.finditer(r"\{\{(\w+)\}\}", content):
        var_name = match.group(1)
        if var_name in variables:
            content = content.replace(f"{{{{{var_name}}}}}", str(variables[var_name]))
        else:
            missing.append(var_name)
    return {"preview": content, "variables_used": list(variables.keys()), "missing_variables": missing}


@router.get("/{template_id}/analytics-detail")
async def get_template_analytics_detail(template_id: int, current_user=Depends(get_current_active_user)):
    """Get analytics for a specific template."""
    uid = _uid(current_user)
    result = execute_query("SELECT id, name, use_count, success_rate, user_id FROM proposal_templates WHERE id = ?", [template_id])
    t = _parse_one(result)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if to_int(t["user_id"]) != uid:
        raise HTTPException(status_code=403, detail="Not your template")
    return {"id": to_int(t["id"]), "name": t["name"], "use_count": to_int(t["use_count"]), "success_rate": float(t.get("success_rate") or 0)}


@router.post("/{template_id}/generate")
async def generate_proposal_from_template(
    template_id: int,
    project_id: int,
    variables: Optional[dict] = None,
    customize: bool = False,
    current_user=Depends(get_current_active_user),
):
    """Generate a proposal from template."""
    uid = _uid(current_user)
    result = execute_query("SELECT content, user_id, is_public FROM proposal_templates WHERE id = ?", [template_id])
    t = _parse_one(result)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if to_int(t["user_id"]) != uid and not _is_public(t.get("is_public")):
        raise HTTPException(status_code=403, detail="Access denied")
    content = t.get("content") or ""
    if variables:
        for k, v in variables.items():
            content = content.replace(f"{{{{{k}}}}}", str(v))
    # Increment template use count
    execute_query("UPDATE proposal_templates SET use_count = use_count + 1 WHERE id = ?", [template_id])
    return {
        "proposal_draft": {"cover_letter": content},
        "template_id": template_id,
        "project_id": project_id,
        "requires_review": customize,
    }

