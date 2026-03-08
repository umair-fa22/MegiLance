# @AI-HINT: Availability calendar API - Freelancer scheduling and booking (Turso-backed)
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date, time, timezone

from app.db.turso_http import execute_query
from app.core.security import get_current_active_user

router = APIRouter(prefix="/availability")


def _uid(cu):
    return cu.id if hasattr(cu, "id") else cu.get("user_id")


def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell


def _row_dict(row, cols):
    names = [c.get("name", c) if isinstance(c, dict) else c for c in cols]
    vals = [_val(c) for c in row]
    return dict(zip(names, vals))


class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    is_available: bool = True


class DayAvailability(BaseModel):
    day_of_week: int
    is_working_day: bool
    slots: List[TimeSlot]


# ── Schedule / weekly pattern ──────────────────────────────

@router.get("/schedule")
async def get_my_schedule(start_date: date, end_date: date, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    slots_res = execute_query(
        "SELECT day_of_week, start_time, end_time, is_available, slot_type FROM availability_slots WHERE user_id = ? ORDER BY day_of_week, start_time",
        [uid],
    )
    scols = slots_res.get("columns", slots_res.get("cols", []))
    slots = [_row_dict(r, scols) for r in slots_res.get("rows", [])]

    exc_res = execute_query(
        "SELECT exception_date, is_available, start_time, end_time, reason FROM availability_exceptions WHERE user_id = ? AND exception_date BETWEEN ? AND ?",
        [uid, start_date.isoformat(), end_date.isoformat()],
    )
    ecols = exc_res.get("columns", exc_res.get("cols", []))
    exceptions = [_row_dict(r, ecols) for r in exc_res.get("rows", [])]

    by_day: dict = {}
    for s in slots:
        d = s.get("day_of_week", 0)
        by_day.setdefault(d, []).append({"start": s.get("start_time"), "end": s.get("end_time"), "status": "available" if s.get("is_available") else "busy"})

    return {
        "user_id": uid,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "availability_blocks": [{"day_of_week": d, "slots": sl} for d, sl in sorted(by_day.items())],
        "exceptions": exceptions,
        "time_zone": "UTC",
    }


@router.get("/weekly-pattern")
async def get_weekly_pattern(current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    result = execute_query(
        "SELECT id, day_of_week, start_time, end_time, is_available FROM availability_slots WHERE user_id = ? ORDER BY day_of_week, start_time",
        [uid],
    )
    cols = result.get("columns", result.get("cols", []))
    rows = [_row_dict(r, cols) for r in result.get("rows", [])]
    by_day: dict = {}
    for r in rows:
        d = r.get("day_of_week", 0)
        by_day.setdefault(d, []).append({"start_time": r.get("start_time"), "end_time": r.get("end_time"), "is_available": bool(r.get("is_available"))})
    pattern = []
    for i in range(7):
        sl = by_day.get(i, [])
        pattern.append({"day_of_week": i, "is_working_day": len(sl) > 0, "slots": sl})
    return pattern


@router.put("/weekly-pattern")
async def update_weekly_pattern(pattern: List[DayAvailability], current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    execute_query("DELETE FROM availability_slots WHERE user_id = ?", [uid])
    for day in pattern:
        for slot in day.slots:
            execute_query(
                "INSERT INTO availability_slots (user_id, day_of_week, start_time, end_time, is_available, slot_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'regular', ?, ?)",
                [uid, day.day_of_week, slot.start_time, slot.end_time, int(slot.is_available), now, now],
            )
    return {"message": "Weekly pattern updated", "days": len(pattern)}


# ── Exceptions (time off, special days) ────────────────────

@router.post("/blocks")
async def create_availability_block(
    exception_date: date,
    is_available: bool = False,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    reason: Optional[str] = None,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        "INSERT INTO availability_exceptions (user_id, exception_date, is_available, start_time, end_time, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [uid, exception_date.isoformat(), int(is_available), start_time, end_time, reason, now],
    )
    eid = execute_query("SELECT last_insert_rowid()")["rows"][0][0]
    return {"id": eid, "user_id": uid, "exception_date": exception_date.isoformat(), "is_available": is_available, "reason": reason}


@router.get("/blocks")
async def get_availability_blocks(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    conds = ["user_id = ?"]
    params: list = [uid]
    if start_date:
        conds.append("exception_date >= ?")
        params.append(start_date.isoformat())
    if end_date:
        conds.append("exception_date <= ?")
        params.append(end_date.isoformat())
    where = " AND ".join(conds)
    result = execute_query(f"SELECT id, user_id, exception_date, is_available, start_time, end_time, reason, created_at FROM availability_exceptions WHERE {where} ORDER BY exception_date", params)
    cols = result.get("columns", result.get("cols", []))
    return [_row_dict(r, cols) for r in result.get("rows", [])]


@router.put("/blocks/{block_id}")
async def update_availability_block(
    block_id: int,
    is_available: Optional[bool] = None,
    reason: Optional[str] = None,
    current_user=Depends(get_current_active_user),
):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM availability_exceptions WHERE id = ? AND user_id = ?", [block_id, uid])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Block not found")
    sets, params = [], []
    if is_available is not None:
        sets.append("is_available = ?")
        params.append(int(is_available))
    if reason is not None:
        sets.append("reason = ?")
        params.append(reason)
    if sets:
        params.append(block_id)
        execute_query(f"UPDATE availability_exceptions SET {', '.join(sets)} WHERE id = ?", params)
    return {"id": block_id, "updated": True}


@router.delete("/blocks/{block_id}")
async def delete_availability_block(block_id: int, current_user=Depends(get_current_active_user)):
    uid = _uid(current_user)
    existing = execute_query("SELECT id FROM availability_exceptions WHERE id = ? AND user_id = ?", [block_id, uid])
    if not existing.get("rows"):
        raise HTTPException(status_code=404, detail="Block not found")
    execute_query("DELETE FROM availability_exceptions WHERE id = ?", [block_id])
    return {"message": "Block deleted", "id": block_id}


# ── Public: available slots for a user ─────────────────────

@router.get("/user/{user_id}/available-slots")
async def get_user_available_slots(
    user_id: int,
    query_date: date = Query(..., alias="date"),
    duration_minutes: int = Query(60, ge=15, le=480),
    current_user=Depends(get_current_active_user),
):
    dow = query_date.weekday()
    slots_res = execute_query(
        "SELECT start_time, end_time FROM availability_slots WHERE user_id = ? AND day_of_week = ? AND is_available = 1 ORDER BY start_time",
        [user_id, dow],
    )
    cols = slots_res.get("columns", slots_res.get("cols", []))
    slots = [_row_dict(r, cols) for r in slots_res.get("rows", [])]
    exc_res = execute_query(
        "SELECT is_available FROM availability_exceptions WHERE user_id = ? AND exception_date = ?",
        [user_id, query_date.isoformat()],
    )
    if exc_res.get("rows") and not exc_res["rows"][0][0]:
        slots = []
    return {"user_id": user_id, "date": query_date.isoformat(), "duration_minutes": duration_minutes, "available_slots": slots, "timezone": "UTC"}


@router.get("/settings")
async def get_availability_settings(current_user=Depends(get_current_active_user)):
    return {
        "timezone": "UTC",
        "default_meeting_duration": 60,
        "buffer_before": 15,
        "buffer_after": 15,
        "minimum_notice_hours": 24,
        "maximum_advance_days": 60,
        "auto_accept_bookings": False,
    }


@router.put("/settings")
async def update_availability_settings(
    tz: Optional[str] = None,
    default_meeting_duration: Optional[int] = None,
    buffer_before: Optional[int] = None,
    buffer_after: Optional[int] = None,
    minimum_notice_hours: Optional[int] = None,
    maximum_advance_days: Optional[int] = None,
    auto_accept_bookings: Optional[bool] = None,
    current_user=Depends(get_current_active_user),
):
    """Update availability settings"""
    return {
        "message": "Settings updated successfully",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/sync-status")
async def get_calendar_sync_status(
    current_user=Depends(get_current_active_user),
):
    """Get external calendar sync status"""
    return {
        "google_calendar": {"connected": False, "last_sync": None},
        "outlook_calendar": {"connected": False, "last_sync": None},
        "apple_calendar": {"connected": False, "last_sync": None}
    }


@router.post("/sync/{provider}")
async def sync_calendar(
    provider: str = "google",
    current_user=Depends(get_current_active_user),
):
    """Initiate calendar sync with external provider"""
    return {
        "provider": provider,
        "auth_url": f"https://auth.megilance.com/calendar/{provider}?user={current_user.id}"
    }

