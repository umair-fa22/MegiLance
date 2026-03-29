# @AI-HINT: Video communication service layer - all database operations for video call endpoints
import logging
import json
from datetime import datetime, timedelta, timezone
from typing import Optional
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query


def create_call_record(host_id: int, participant_ids: list, room_id: str,
                       call_type: str, scheduled_at: Optional[str],
                       metadata_json: Optional[str]) -> Optional[dict]:
    """Insert a video call record and return the created call data."""
    execute_query("""
        INSERT INTO video_calls (
            host_id, participant_ids, room_id, call_type,
            status, scheduled_at, metadata, created_at
        ) VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)
    """, [
        host_id,
        json.dumps(participant_ids),
        room_id,
        call_type,
        scheduled_at,
        metadata_json,
        datetime.now(timezone.utc).isoformat()
    ])

    result = execute_query("""
        SELECT id, room_id, host_id, participant_ids, call_type,
               status, scheduled_at, created_at
        FROM video_calls
        WHERE room_id = ?
    """, [room_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "call_id": int(row[0].get("value")),
        "room_id": row[1].get("value"),
        "host_id": int(row[2].get("value")),
        "participant_ids": json.loads(row[3].get("value")),
        "call_type": row[4].get("value"),
        "status": row[5].get("value"),
        "join_url": f"https://megilance.com/video/join/{room_id}",
        "scheduled_at": row[6].get("value"),
        "started_at": None,
        "ended_at": None,
        "recording_url": None,
        "created_at": row[7].get("value")
    }


def send_call_notifications(participant_ids: list, room_id: str):
    """Send video call invitation notifications to participants."""
    for participant_id in participant_ids:
        execute_query("""
            INSERT INTO notifications (
                user_id, notification_type, title, message,
                link, is_read, created_at
            ) VALUES (?, 'video_call_invitation', 'Video Call Invitation',
                     'You have been invited to a video call', ?, 0, ?)
        """, [
            participant_id,
            f"/video/join/{room_id}",
            datetime.now(timezone.utc).isoformat()
        ])


def get_call_by_room_id(room_id: str) -> Optional[dict]:
    """Get call details by room_id for join verification."""
    result = execute_query("""
        SELECT id, host_id, participant_ids, call_type, status
        FROM video_calls
        WHERE room_id = ?
    """, [room_id])

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "call_id": int(row[0].get("value")),
        "host_id": int(row[1].get("value")),
        "participant_ids": json.loads(row[2].get("value")),
        "call_type": row[3].get("value"),
        "status": row[4].get("value")
    }


def update_call_status_to_ongoing(call_id: int):
    """Update call status to 'ongoing' and set started_at."""
    execute_query("""
        UPDATE video_calls
        SET status = 'ongoing', started_at = ?
        WHERE id = ?
    """, [datetime.now(timezone.utc).isoformat(), call_id])


def get_call_host_and_start(call_id: int) -> Optional[dict]:
    """Get host_id and started_at for a call."""
    result = execute_query("""
        SELECT host_id, started_at FROM video_calls WHERE id = ?
    """, [call_id])

    if not result or not result.get("rows"):
        return None

    return {
        "host_id": int(result["rows"][0][0].get("value")),
        "started_at": result["rows"][0][1].get("value")
    }


def end_call(call_id: int, duration_seconds: int):
    """Mark call as ended with duration."""
    execute_query("""
        UPDATE video_calls
        SET status = 'ended', ended_at = ?, duration_seconds = ?
        WHERE id = ?
    """, [datetime.now(timezone.utc).isoformat(), duration_seconds, call_id])


def list_user_calls(user_id: int, status: Optional[str], limit: int, offset: int) -> list:
    """List calls for a user (as host or participant)."""
    query = """
        SELECT id, room_id, host_id, participant_ids, call_type,
               status, scheduled_at, started_at, ended_at,
               recording_url, created_at
        FROM video_calls
        WHERE (host_id = ? OR participant_ids LIKE ?)
    """
    params: list = [user_id, f'%{user_id}%']

    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    result = execute_query(query, params)

    calls = []
    if result and result.get("rows"):
        for row in result["rows"]:
            calls.append({
                "call_id": int(row[0].get("value")),
                "room_id": row[1].get("value"),
                "host_id": int(row[2].get("value")),
                "participant_ids": json.loads(row[3].get("value")),
                "call_type": row[4].get("value"),
                "status": row[5].get("value"),
                "join_url": f"https://megilance.com/video/join/{row[1].get('value')}",
                "scheduled_at": row[6].get("value"),
                "started_at": row[7].get("value"),
                "ended_at": row[8].get("value"),
                "recording_url": row[9].get("value"),
                "created_at": row[10].get("value")
            })

    return calls


def get_call_participants(call_id: int) -> Optional[dict]:
    """Get host_id and participant_ids for a call."""
    result = execute_query("""
        SELECT host_id, participant_ids FROM video_calls WHERE id = ?
    """, [call_id])

    if not result or not result.get("rows"):
        return None

    return {
        "host_id": int(result["rows"][0][0].get("value")),
        "participant_ids": json.loads(result["rows"][0][1].get("value"))
    }


def log_screen_share_event(user_id: int, call_id: int, stream_id: str):
    """Log a screen share start event to analytics."""
    execute_query("""
        INSERT INTO analytics_events (
            user_id, event_name, event_category, event_properties, created_at
        ) VALUES (?, 'screen_share_started', 'video_call', ?, ?)
    """, [
        user_id,
        json.dumps({"call_id": call_id, "stream_id": stream_id}),
        datetime.now(timezone.utc).isoformat()
    ])


def store_whiteboard_action(call_id: int, user_id: int, action_type: str, data: dict):
    """Store a whiteboard action for replay."""
    execute_query("""
        INSERT INTO collaboration_sessions (
            project_id, session_type, participants, session_data,
            is_active, created_at
        ) VALUES (?, 'whiteboard', ?, ?, 1, ?)
    """, [
        call_id,
        json.dumps([user_id]),
        json.dumps({
            "action_type": action_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }),
        datetime.now(timezone.utc).isoformat()
    ])


def get_call_host(call_id: int) -> Optional[int]:
    """Get the host_id for a call, or None if call not found."""
    result = execute_query("""
        SELECT host_id FROM video_calls WHERE id = ?
    """, [call_id])

    if not result or not result.get("rows"):
        return None

    return int(result["rows"][0][0].get("value"))


def save_recording_url(call_id: int, recording_url: str):
    """Save the recording URL on a video call record."""
    execute_query("""
        UPDATE video_calls SET recording_url = ? WHERE id = ?
    """, [recording_url, call_id])


def get_user_availability_slots(user_id: int, start_date: str, end_date: str) -> list:
    """Get busy time slots from scheduled/ongoing calls for a user in a date range."""
    result = execute_query("""
        SELECT scheduled_at, duration_seconds FROM video_calls
        WHERE (host_id = ? OR participant_ids LIKE ?)
        AND scheduled_at BETWEEN ? AND ?
        AND status IN ('scheduled', 'ongoing')
    """, [user_id, f'%{user_id}%', start_date, end_date])

    busy_slots = []
    if result and result.get("rows"):
        for row in result["rows"]:
            scheduled_at = row[0].get("value")
            duration = row[1].get("value", 3600)
            busy_slots.append({
                "start": scheduled_at,
                "end": (datetime.fromisoformat(scheduled_at) + timedelta(seconds=duration)).isoformat()
            })

    return busy_slots


def get_call_analytics(user_id: int, start_date: str) -> dict:
    """Get call statistics for a user from a start date."""
    result = execute_query("""
        SELECT 
            COUNT(*) as total_calls,
            SUM(duration_seconds) as total_duration,
            AVG(duration_seconds) as avg_duration
        FROM video_calls
        WHERE (host_id = ? OR participant_ids LIKE ?)
        AND created_at >= ?
    """, [user_id, f'%{user_id}%', start_date])

    stats = {
        "total_calls": 0,
        "total_duration_minutes": 0,
        "avg_duration_minutes": 0
    }

    if result and result.get("rows"):
        row = result["rows"][0]
        stats = {
            "total_calls": int(row[0].get("value", 0)),
            "total_duration_minutes": int(row[1].get("value", 0)) // 60,
            "avg_duration_minutes": int(row[2].get("value", 0)) // 60
        }

    return stats
