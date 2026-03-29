# @AI-HINT: Notes and tags API - Organization and metadata (Turso-backed)
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone

from app.db.turso_http import execute_query
from app.core.security import get_current_active_user
from app.services.db_utils import paginate_params

router = APIRouter(prefix="/notes-tags")


def _uid(cu):
    return cu.id if hasattr(cu, "id") else cu.get("user_id")


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_dict(row, cols):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in cols]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


# ── Notes CRUD ──────────────────────────────────────────────

@router.get("/notes")
async def get_notes(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    offset, limit = paginate_params(page, page_size)
    conds = ["user_id = ?"]
    params: list = [uid]
    if entity_type:
        conds.append("entity_type = ?")
        params.append(entity_type)
    if entity_id:
        conds.append("entity_id = ?")
        params.append(entity_id)
    if search:
        conds.append("content LIKE ?")
        params.append(f"%{search}%")
    where = " AND ".join(conds)
    params.extend([limit, offset])
    result = execute_query(
        f"SELECT id, user_id, entity_type, entity_id, content, is_private, created_at, updated_at FROM notes WHERE {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params,
    )
    cols = result.get("columns", result.get("cols", []))
    return [_row_dict(r, cols) for r in result.get("rows", [])]


@router.post("/notes")
async def create_note(
    entity_type: str,
    entity_id: str,
    content: str,
    is_private: bool = True,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO notes (user_id, entity_type, entity_id, content, is_private, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [uid, entity_type, entity_id, content, int(is_private), now, now],
    )
    nid = _val(execute_query("SELECT last_insert_rowid()")["rows"][0][0])
    return {"id": nid, "user_id": uid, "entity_type": entity_type, "entity_id": entity_id, "content": content, "is_private": is_private, "created_at": now}


@router.get("/notes/{note_id}")
async def get_note(note_id: int, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    result = execute_query("SELECT id, user_id, entity_type, entity_id, content, is_private, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?", [note_id, uid])
    cols = result.get("columns", result.get("cols", []))
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Note not found")
    return _row_dict(result["rows"][0], cols)


@router.put("/notes/{note_id}")
async def update_note(
    note_id: int,
    content: Optional[str] = None,
    is_private: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM notes WHERE id = ? AND user_id = ?", [note_id, uid])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Note not found")
    sets, params = ["updated_at = ?"], [datetime.now(timezone.utc).isoformat()]
    if content is not None:
        sets.append("content = ?")
        params.append(content)
    if is_private is not None:
        sets.append("is_private = ?")
        params.append(int(is_private))
    params.append(note_id)
    execute_query(f"UPDATE notes SET {', '.join(sets)} WHERE id = ?", params)
    return {"id": note_id, "updated": True}


@router.delete("/notes/{note_id}")
async def delete_note(note_id: int, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM notes WHERE id = ? AND user_id = ?", [note_id, uid])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Note not found")
    execute_query("DELETE FROM notes WHERE id = ?", [note_id])
    return {"message": "Note deleted", "id": note_id}


# ── Tags CRUD ──────────────────────────────────────────────

@router.get("/tags")
async def get_tags(search: Optional[str] = None, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    conds = ["1=1"]
    params: list = []
    if search:
        conds.append("t.name LIKE ?")
        params.append(f"%{search}%")
    where = " AND ".join(conds)
    result = execute_query(
        f"SELECT t.id, t.name, t.slug, t.type, (SELECT COUNT(*) FROM entity_tags et WHERE et.tag_id = t.id) as entity_count FROM tags t WHERE {where} ORDER BY t.name",
        params,
    )
    cols = result.get("columns", result.get("cols", []))
    return [_row_dict(r, cols) for r in result.get("rows", [])]


@router.post("/tags")
async def create_tag(name: str, color: str = "#000000", description: Optional[str] = None, current_user=Depends(get_current_active_user)):
    slug = name.lower().replace(" ", "-")
    existing = execute_query("SELECT id FROM tags WHERE slug = ?", [slug])
    if existing.get("rows"):
        raise HTTPException(status_code=409, detail="Tag already exists")
    execute_query("INSERT INTO tags (name, slug, type, usage_count, created_at, updated_at) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))", [name, slug, "custom"])
    tid = _val(execute_query("SELECT last_insert_rowid()")["rows"][0][0])
    return {"id": tid, "name": name, "slug": slug, "color": color}


@router.put("/tags/{tag_id}")
async def update_tag(tag_id: int, name: Optional[str] = None, color: Optional[str] = None, current_user=Depends(get_current_active_user)):
    existing = execute_query("SELECT id FROM tags WHERE id = ?", [tag_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not found")
    if name:
        slug = name.lower().replace(" ", "-")
        execute_query("UPDATE tags SET name = ?, slug = ? WHERE id = ?", [name, slug, tag_id])
    return {"id": tag_id, "updated": True}


@router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: int, current_user=Depends(get_current_active_user)):
    existing = execute_query("SELECT id FROM tags WHERE id = ?", [tag_id])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Tag not found")
    execute_query("DELETE FROM entity_tags WHERE tag_id = ?", [tag_id])
    execute_query("DELETE FROM tags WHERE id = ?", [tag_id])
    return {"message": "Tag deleted", "id": tag_id}


# ── Tag assignment ─────────────────────────────────────────

@router.post("/tags/{tag_id}/assign")
async def assign_tag(tag_id: int, entity_type: str, entity_id: str, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id = ?", [tag_id, entity_type, entity_id])
    if existing.get("rows"):
        return {"tag_id": tag_id, "entity_type": entity_type, "entity_id": entity_id, "assigned": True, "already_existed": True}
    now = datetime.now(timezone.utc).isoformat()
    execute_query("INSERT INTO entity_tags (tag_id, entity_type, entity_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)", [tag_id, entity_type, entity_id, uid, now])
    return {"tag_id": tag_id, "entity_type": entity_type, "entity_id": entity_id, "assigned": True}


@router.delete("/tags/{tag_id}/assign")
async def remove_tag(tag_id: int, entity_type: str, entity_id: str, current_user=Depends(get_current_active_user)):
    execute_query("DELETE FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id = ?", [tag_id, entity_type, entity_id])
    return {"tag_id": tag_id, "entity_type": entity_type, "entity_id": entity_id, "removed": True}


@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_notes_tags(entity_type: str, entity_id: str, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    notes_res = execute_query(
        "SELECT id, content, is_private, created_at FROM notes WHERE entity_type = ? AND entity_id = ? AND user_id = ? ORDER BY created_at DESC",
        [entity_type, entity_id, uid],
    )
    ncols = notes_res.get("columns", notes_res.get("cols", []))
    notes = [_row_dict(r, ncols) for r in notes_res.get("rows", [])]

    tags_res = execute_query(
        "SELECT t.id, t.name, t.slug FROM entity_tags et JOIN tags t ON et.tag_id = t.id WHERE et.entity_type = ? AND et.entity_id = ?",
        [entity_type, entity_id],
    )
    tcols = tags_res.get("columns", tags_res.get("cols", []))
    tags = [_row_dict(r, tcols) for r in tags_res.get("rows", [])]
    return {"entity_type": entity_type, "entity_id": entity_id, "notes": notes, "tags": tags}


@router.post("/bulk-tag")
async def bulk_tag_entities(tag_id: int, entity_type: str, entity_ids: List[str], current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    count = 0
    for eid in entity_ids:
        existing = execute_query("SELECT id FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id = ?", [tag_id, entity_type, eid])
        if not existing.get("rows"):
            execute_query("INSERT INTO entity_tags (tag_id, entity_type, entity_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)", [tag_id, entity_type, eid, uid, now])
            count += 1
    return {"tag_id": tag_id, "entity_type": entity_type, "tagged_count": count}


@router.get("/search")
async def search_by_tags(tag_ids: List[int] = Query([]), entity_type: Optional[str] = None, current_user=Depends(get_current_active_user)):
    if not tag_ids:
        return {"results": [], "total": 0}
    placeholders = ",".join(["?"] * len(tag_ids))
    conds = [f"et.tag_id IN ({placeholders})"]
    params = list(tag_ids)
    if entity_type:
        conds.append("et.entity_type = ?")
        params.append(entity_type)
    where = " AND ".join(conds)
    result = execute_query(
        f"SELECT et.entity_type, et.entity_id, GROUP_CONCAT(et.tag_id) as tag_ids FROM entity_tags et WHERE {where} GROUP BY et.entity_type, et.entity_id",
        params,
    )
    cols = result.get("columns", result.get("cols", []))
    rows = [_row_dict(r, cols) for r in result.get("rows", [])]
    return {"results": rows, "total": len(rows)}


@router.get("/stats")
async def get_notes_tags_stats(current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    total_notes = execute_query("SELECT COUNT(*) FROM notes WHERE user_id = ?", [uid])
    total_tags = execute_query("SELECT COUNT(*) FROM tags")
    top_tags = execute_query(
        "SELECT t.name, COUNT(et.id) as cnt FROM entity_tags et JOIN tags t ON et.tag_id = t.id GROUP BY t.id ORDER BY cnt DESC LIMIT 5"
    )
    tcols = top_tags.get("columns", top_tags.get("cols", []))
    most_used = [_row_dict(r, tcols) for r in top_tags.get("rows", [])]
    notes_by_type = execute_query("SELECT entity_type, COUNT(*) as cnt FROM notes WHERE user_id = ? GROUP BY entity_type", [uid])
    nc = notes_by_type.get("columns", notes_by_type.get("cols", []))
    by_entity = {_val(r[0]): _val(r[1]) for r in notes_by_type.get("rows", [])}
    return {
        "total_notes": _val(total_notes["rows"][0][0]) if total_notes.get("rows") else 0,
        "total_tags": _val(total_tags["rows"][0][0]) if total_tags.get("rows") else 0,
        "most_used_tags": most_used,
        "notes_by_entity": by_entity,
    }

