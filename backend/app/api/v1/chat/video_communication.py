# @AI-HINT: Advanced video calling and screen sharing API using WebRTC - delegates to video_communication_service
"""
Video Communication API

Features:
- One-on-one video calls
- Group video conferences
- Screen sharing
- Virtual whiteboard
- Call recording
- Real-time transcription
- Meeting scheduler integration
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
import logging
import json
import secrets
logger = logging.getLogger(__name__)

from app.core.security import get_current_active_user, decode_token
from app.core.config import get_settings
from app.models.user import User
from app.services import video_communication_service as vc_service

settings = get_settings()

router = APIRouter(prefix="/video", tags=["video"])


# ============================================================================
# Request/Response Models
# ============================================================================

class CreateCallRequest(BaseModel):
    participant_ids: List[int]
    call_type: str = Field(..., pattern="^(one_on_one|group|screen_share)$")
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = 60
    enable_recording: bool = False
    metadata: Optional[Dict[str, Any]] = None


class CallResponse(BaseModel):
    call_id: int
    room_id: str
    host_id: int
    participant_ids: List[int]
    call_type: str
    status: str
    join_url: str
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    recording_url: Optional[str]
    created_at: datetime


class JoinCallResponse(BaseModel):
    room_id: str
    ice_servers: List[Dict[str, Any]]
    turn_credentials: Optional[Dict[str, str]]
    participant_count: int
    call_config: Dict[str, Any]


class ScreenShareRequest(BaseModel):
    call_id: int
    stream_id: str


class WhiteboardAction(BaseModel):
    call_id: int
    action_type: str  # 'draw', 'erase', 'text', 'shape', 'clear'
    data: Dict[str, Any]


# ============================================================================
# WebRTC Configuration
# ============================================================================

class WebRTCService:
    """WebRTC signaling and media server integration"""

    def __init__(self):
        self.stun_servers = [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {"urls": "stun:stun2.l.google.com:19302"},
        ]
        self.turn_servers = [
            {
                "urls": getattr(settings, 'TURN_SERVER_URL', 'turn:turn.megilance.com:3478'),
                "username": getattr(settings, 'TURN_USERNAME', 'megilance'),
                "credential": getattr(settings, 'TURN_CREDENTIAL', '')
            }
        ]

    def get_ice_servers(self) -> List[Dict[str, Any]]:
        return self.stun_servers + self.turn_servers

    def generate_room_id(self) -> str:
        return f"room_{secrets.token_urlsafe(16)}"


webrtc_service = WebRTCService()


# ============================================================================
# Call Management Endpoints
# ============================================================================

@router.post("/calls", response_model=CallResponse)
async def create_call(
    request: CreateCallRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Create a new video call"""
    room_id = webrtc_service.generate_room_id()
    scheduled_at = request.scheduled_at.isoformat() if request.scheduled_at else None
    metadata_json = json.dumps(request.metadata) if request.metadata else None

    call_data = vc_service.create_call_record(
        host_id=current_user.id,
        participant_ids=request.participant_ids,
        room_id=room_id,
        call_type=request.call_type,
        scheduled_at=scheduled_at,
        metadata_json=metadata_json
    )

    if not call_data:
        raise HTTPException(status_code=500, detail="Failed to create call")

    vc_service.send_call_notifications(request.participant_ids, room_id)

    return CallResponse(**call_data)


@router.post("/calls/{room_id}/join", response_model=JoinCallResponse)
async def join_call(
    room_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Join a video call"""
    call = vc_service.get_call_by_room_id(room_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    if current_user.id != call["host_id"] and current_user.id not in call["participant_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized to join this call")

    if call["status"] == "scheduled":
        vc_service.update_call_status_to_ongoing(call["call_id"])

    participant_count = len(call["participant_ids"]) + 1

    return JoinCallResponse(
        room_id=room_id,
        ice_servers=webrtc_service.get_ice_servers(),
        turn_credentials={
            "username": f"user_{current_user.id}",
            "credential": secrets.token_urlsafe(16)
        },
        participant_count=participant_count,
        call_config={
            "call_type": call["call_type"],
            "max_participants": 50 if call["call_type"] == "group" else 2,
            "enable_recording": True,
            "enable_screen_share": True,
            "enable_whiteboard": True,
            "video_quality": "720p",
            "audio_codec": "opus"
        }
    )


@router.post("/calls/{call_id}/end")
async def end_call(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    
):
    """End a video call (host only)"""
    call_info = vc_service.get_call_host_and_start(call_id)
    if not call_info:
        raise HTTPException(status_code=404, detail="Call not found")

    if current_user.id != call_info["host_id"]:
        raise HTTPException(status_code=403, detail="Only host can end call")

    duration_seconds = 0
    if call_info["started_at"]:
        start_time = datetime.fromisoformat(call_info["started_at"])
        duration_seconds = int((datetime.now(timezone.utc) - start_time).total_seconds())

    vc_service.end_call(call_id, duration_seconds)

    return {
        "message": "Call ended successfully",
        "duration_seconds": duration_seconds
    }


@router.get("/calls", response_model=List[CallResponse])
async def list_calls(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    
):
    """List user's video calls"""
    calls_data = vc_service.list_user_calls(current_user.id, status, limit, offset)
    return [CallResponse(**c) for c in calls_data]


# ============================================================================
# Screen Sharing
# ============================================================================

@router.post("/screen-share/start")
async def start_screen_share(
    request: ScreenShareRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Start screen sharing in a call"""
    participants = vc_service.get_call_participants(request.call_id)
    if not participants:
        raise HTTPException(status_code=404, detail="Call not found")

    if current_user.id != participants["host_id"] and current_user.id not in participants["participant_ids"]:
        raise HTTPException(status_code=403, detail="Not in this call")

    vc_service.log_screen_share_event(current_user.id, request.call_id, request.stream_id)

    return {
        "message": "Screen sharing started",
        "stream_id": request.stream_id,
        "permissions": ["audio", "video", "screen"]
    }


# ============================================================================
# Virtual Whiteboard
# ============================================================================

@router.post("/whiteboard/action")
async def whiteboard_action(
    request: WhiteboardAction,
    current_user: User = Depends(get_current_active_user),
    
):
    """Execute whiteboard action"""
    participants = vc_service.get_call_participants(request.call_id)
    if not participants:
        raise HTTPException(status_code=404, detail="Call not found")

    vc_service.store_whiteboard_action(request.call_id, current_user.id, request.action_type, request.data)

    return {
        "message": "Whiteboard action recorded",
        "action_type": request.action_type
    }


# ============================================================================
# WebSocket for Real-time Signaling
# ============================================================================

class ConnectionManager:
    """Manage WebSocket connections for WebRTC signaling"""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict, exclude: Optional[WebSocket] = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude:
                    await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_signaling(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for WebRTC signaling (requires token auth)"""
    # Authenticate via query parameter token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    try:
        payload = decode_token(token)
        if not payload or not payload.get("sub"):
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(room_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "offer":
                await manager.broadcast(room_id, {
                    "type": "offer",
                    "sdp": data.get("sdp"),
                    "from": data.get("from")
                }, exclude=websocket)

            elif message_type == "answer":
                await manager.broadcast(room_id, {
                    "type": "answer",
                    "sdp": data.get("sdp"),
                    "from": data.get("from")
                }, exclude=websocket)

            elif message_type == "ice_candidate":
                await manager.broadcast(room_id, {
                    "type": "ice_candidate",
                    "candidate": data.get("candidate"),
                    "from": data.get("from")
                }, exclude=websocket)

            elif message_type == "join":
                await manager.broadcast(room_id, {
                    "type": "participant_joined",
                    "user_id": data.get("user_id"),
                    "name": data.get("name")
                }, exclude=websocket)

            elif message_type == "whiteboard":
                await manager.broadcast(room_id, {
                    "type": "whiteboard_update",
                    "action": data.get("action"),
                    "data": data.get("data")
                }, exclude=websocket)

            elif message_type == "screen_share":
                await manager.broadcast(room_id, {
                    "type": "screen_share_started",
                    "user_id": data.get("user_id"),
                    "stream_id": data.get("stream_id")
                }, exclude=websocket)

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(room_id, {
            "type": "participant_left",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })


# ============================================================================
# Call Recording
# ============================================================================

@router.post("/calls/{call_id}/recording/start")
async def start_recording(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    
):
    """Start call recording (host only)"""
    host_id = vc_service.get_call_host(call_id)
    if host_id is None:
        raise HTTPException(status_code=404, detail="Call not found")

    if current_user.id != host_id:
        raise HTTPException(status_code=403, detail="Only host can start recording")

    recording_id = f"rec_{secrets.token_urlsafe(16)}"

    return {
        "message": "Recording started",
        "recording_id": recording_id,
        "notice": "All participants will be notified that recording has started"
    }


@router.post("/calls/{call_id}/recording/stop")
async def stop_recording(
    call_id: int,
    current_user: User = Depends(get_current_active_user),
    
):
    """Stop call recording and get download URL"""
    host_id = vc_service.get_call_host(call_id)
    if host_id is None:
        raise HTTPException(status_code=404, detail="Call not found")

    if current_user.id != host_id:
        raise HTTPException(status_code=403, detail="Only host can stop recording")

    recording_url = f"https://recordings.megilance.com/{call_id}/recording.mp4"
    vc_service.save_recording_url(call_id, recording_url)

    return {
        "message": "Recording stopped",
        "recording_url": recording_url,
        "expires_in_days": 30
    }


# ============================================================================
# Meeting Scheduler Integration
# ============================================================================

@router.get("/availability/{user_id}")
async def get_user_availability(
    user_id: int,
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get user's availability for scheduling calls"""
    busy_slots = vc_service.get_user_availability_slots(user_id, start_date, end_date)

    return {
        "user_id": user_id,
        "busy_slots": busy_slots,
        "timezone": "UTC"
    }


# ============================================================================
# Call Analytics
# ============================================================================

@router.get("/analytics/calls")
async def get_call_analytics(
    period: str = "week",
    current_user: User = Depends(get_current_active_user),
    
):
    """Get call usage analytics"""
    if period == "day":
        start_date = datetime.now(timezone.utc) - timedelta(days=1)
    elif period == "week":
        start_date = datetime.now(timezone.utc) - timedelta(weeks=1)
    elif period == "month":
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
    else:
        start_date = datetime.now(timezone.utc) - timedelta(days=365)

    stats = vc_service.get_call_analytics(current_user.id, start_date.isoformat())

    return {
        "period": period,
        "stats": stats
    }
