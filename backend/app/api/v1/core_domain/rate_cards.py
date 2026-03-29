# @AI-HINT: Rate cards API - Freelancer pricing structures (Turso-backed)
import logging
import json
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query
from app.core.security import get_current_active_user

router = APIRouter(prefix="/rate-cards")


def _uid(cu):
    return cu.id if hasattr(cu, "id") else cu.get("user_id")


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_dict(row, cols):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in cols]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


RC_COLS = "id, user_id, name, description, base_rate, currency, rate_type, packages, extras, is_default, is_active, created_at, updated_at"


@router.get("/my-cards")
async def get_my_rate_cards(current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    result = execute_query(f"SELECT {RC_COLS} FROM rate_cards WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at DESC", [uid])
    cols = result.get("columns", result.get("cols", []))
    cards = []
    for r in result.get("rows", []):
        d = _row_dict(r, cols)
        if d.get("packages"):
            try:
                d["packages"] = json.loads(d["packages"])
            except Exception:
                pass
        if d.get("extras"):
            try:
                d["extras"] = json.loads(d["extras"])
            except Exception:
                pass
        cards.append(d)
    return cards


@router.post("/")
async def create_rate_card(
    name: str,
    rate_type: str = "hourly",
    base_rate: float = 0,
    currency: str = "USD",
    description: Optional[str] = None,
    is_default: bool = False,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    if is_default:
        execute_query("UPDATE rate_cards SET is_default = 0 WHERE user_id = ?", [uid])
    execute_query(
        "INSERT INTO rate_cards (user_id, name, description, base_rate, currency, rate_type, is_default, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
        [uid, name, description, base_rate, currency, rate_type, int(is_default), now, now],
    )
    rid = _val(execute_query("SELECT last_insert_rowid()")["rows"][0][0])
    return {"id": rid, "user_id": uid, "name": name, "rate_type": rate_type, "base_rate": base_rate, "currency": currency, "is_default": is_default, "created_at": now}


@router.get("/{rate_card_id}")
async def get_rate_card(rate_card_id: int, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    result = execute_query(f"SELECT {RC_COLS} FROM rate_cards WHERE id = ? AND user_id = ?", [rate_card_id, uid])
    cols = result.get("columns", result.get("cols", []))
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Rate card not found")
    d = _row_dict(result["rows"][0], cols)
    for field in ("packages", "extras"):
        if d.get(field):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                pass
    return d


@router.put("/{rate_card_id}")
async def update_rate_card(
    rate_card_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    base_rate: Optional[float] = None,
    rate_type: Optional[str] = None,
    is_default: Optional[bool] = None,
    packages: Optional[str] = None,
    extras: Optional[str] = None,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM rate_cards WHERE id = ? AND user_id = ?", [rate_card_id, uid])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Rate card not found")
    now = datetime.now(timezone.utc).isoformat()
    sets = ["updated_at = ?"]
    params: list = [now]
    if name is not None:
        sets.append("name = ?"); params.append(name)
    if description is not None:
        sets.append("description = ?"); params.append(description)
    if base_rate is not None:
        sets.append("base_rate = ?"); params.append(base_rate)
    if rate_type is not None:
        sets.append("rate_type = ?"); params.append(rate_type)
    if packages is not None:
        sets.append("packages = ?"); params.append(packages)
    if extras is not None:
        sets.append("extras = ?"); params.append(extras)
    if is_default is not None:
        if is_default:
            execute_query("UPDATE rate_cards SET is_default = 0 WHERE user_id = ?", [uid])
        sets.append("is_default = ?"); params.append(int(is_default))
    params.append(rate_card_id)
    execute_query(f"UPDATE rate_cards SET {', '.join(sets)} WHERE id = ?", params)
    return {"id": rate_card_id, "updated": True, "updated_at": now}


@router.delete("/{rate_card_id}")
async def delete_rate_card(rate_card_id: int, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM rate_cards WHERE id = ? AND user_id = ?", [rate_card_id, uid])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Rate card not found")
    execute_query("DELETE FROM rate_cards WHERE id = ?", [rate_card_id])
    return {"message": "Rate card deleted", "id": rate_card_id}


@router.get("/user/{user_id}")
async def get_user_rate_cards(user_id: int, current_user=Depends(get_current_active_user)):
    result = execute_query(
        "SELECT id, name, description, base_rate, currency, rate_type, packages, is_default FROM rate_cards WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC",
        [user_id],
    )
    cols = result.get("columns", result.get("cols", []))
    cards = []
    for r in result.get("rows", []):
        d = _row_dict(r, cols)
        if d.get("packages"):
            try:
                d["packages"] = json.loads(d["packages"])
            except Exception:
                pass
        cards.append(d)
    return {"user_id": user_id, "rate_cards": cards}


@router.post("/calculate")
async def calculate_project_rate(
    rate_card_id: int,
    hours: Optional[int] = None,
    current_user=Depends(get_current_active_user),
):
    result = execute_query("SELECT base_rate, currency, rate_type FROM rate_cards WHERE id = ?", [rate_card_id])
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Rate card not found")
    row = result["rows"][0]
    base_rate = _val(row[0]) or 0
    currency = _val(row[1]) or "USD"
    rate_type = _val(row[2]) or "hourly"
    h = hours or 0
    total = base_rate * h if rate_type == "hourly" else base_rate
    return {"base_rate": base_rate, "hours": h, "rate_type": rate_type, "subtotal": base_rate * h, "total": total, "currency": currency}

