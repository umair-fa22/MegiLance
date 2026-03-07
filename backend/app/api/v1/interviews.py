# @AI-HINT: Video interview API endpoints with WebRTC signaling
"""
Video Interview API - REST endpoints for scheduling and managing video interviews.

Endpoints for:
- Scheduling interviews
- Joining/leaving video rooms
- WebRTC signaling
- Recording management
- Feedback submission
"""

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import logging
import json

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.video_interview import (
    VideoInterviewService, 
    WebRTCSignalingServer,
    get_interview_service,
    get_signaling_server,
    InterviewStatus
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class ScheduleInterviewRequest(BaseModel):
    """Request to schedule an interview."""
    freelancer_id: int = Field(..., description="Freelancer to interview")
    project_id: Optional[int] = Field(None, description="Related project")
    scheduled_time: datetime = Field(..., description="Interview start time (UTC)")
    duration_minutes: int = Field(30, ge=15, le=120, description="Duration in minutes")
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    timezone: str = Field("UTC")

class RescheduleRequest(BaseModel):
    """Request to reschedule an interview."""
    new_time: datetime
    reason: Optional[str] = None

class JoinRoomRequest(BaseModel):
    """Request to join a video room."""
    token: str = Field(..., description="Access token for the room")

class SignalingMessage(BaseModel):
    """WebRTC signaling message."""
    to_user_id: int = Field(..., description="Recipient user ID")
    signal_type: str = Field(..., description="Signal type: offer, answer, ice-candidate")
    data: dict = Field(..., description="Signal payload (SDP or ICE candidate)")

class MediaToggleRequest(BaseModel):
    """Request to toggle media."""
    media_type: str = Field(..., description="video, audio, or screen")
    enabled: bool

class FeedbackRequest(BaseModel):
    """Interview feedback submission."""
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    notes: Optional[str] = Field(None, max_length=2000)
    would_hire: Optional[bool] = None
    skills_demonstrated: Optional[List[str]] = None


# ============================================================================
# Interview Scheduling Endpoints
# ============================================================================

@router.post("/schedule")
async def schedule_interview(
    request: ScheduleInterviewRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """
    Schedule a video interview with a freelancer.
    
    Only clients can schedule interviews. Returns room credentials
    and join URLs for both participants.
    """
    try:
        service = get_interview_service()
        
        interview = await service.schedule_interview(
            client_id=current_user.id,
            freelancer_id=request.freelancer_id,
            project_id=request.project_id,
            scheduled_time=request.scheduled_time,
            duration_minutes=request.duration_minutes,
            title=request.title,
            description=request.description,
            timezone=request.timezone
        )
        
        return {
            "success": True,
            "interview": interview
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Schedule interview error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to schedule interview")


@router.get("/my-interviews")
async def get_my_interviews(
    status: Optional[str] = Query(None, description="Filter by status"),
    upcoming_only: bool = Query(False, description="Only show upcoming"),
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get all interviews for the current user."""
    try:
        service = get_interview_service()
        
        interviews = await service.get_user_interviews(
            user_id=current_user.id,
            status=status,
            upcoming_only=upcoming_only
        )
        
        return {
            "interviews": interviews,
            "total": len(interviews)
        }
        
    except Exception as e:
        logger.error(f"Get interviews error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get interviews")


@router.get("/{room_id}")
async def get_interview_details(
    room_id: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get interview details by room ID."""
    try:
        service = get_interview_service()
        
        interview = await service.get_interview(room_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Verify user is a participant
        if current_user.id not in [interview["client_id"], interview["freelancer_id"]]:
            raise HTTPException(status_code=403, detail="Not authorized to view this interview")
        
        return interview
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get interview error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get interview")


@router.post("/{room_id}/reschedule")
async def reschedule_interview(
    room_id: str,
    request: RescheduleRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Reschedule an interview to a new time."""
    try:
        service = get_interview_service()
        
        result = await service.reschedule_interview(
            room_id=room_id,
            user_id=current_user.id,
            new_time=request.new_time,
            reason=request.reason
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Reschedule error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reschedule interview")


@router.post("/{room_id}/cancel")
async def cancel_interview(
    room_id: str,
    reason: Optional[str] = None,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a scheduled interview."""
    try:
        service = get_interview_service()
        
        result = await service.cancel_interview(
            room_id=room_id,
            user_id=current_user.id,
            reason=reason
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Cancel error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel interview")


# ============================================================================
# Video Room Endpoints
# ============================================================================

@router.post("/{room_id}/join")
async def join_video_room(
    room_id: str,
    request: JoinRoomRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """
    Join a video interview room.
    
    Returns WebRTC configuration including ICE servers
    and information about other participants.
    """
    try:
        service = get_interview_service()
        
        # Generate a socket ID for this session
        import secrets
        socket_id = secrets.token_urlsafe(16)
        
        result = await service.join_room(
            room_id=room_id,
            user_id=current_user.id,
            token=request.token,
            socket_id=socket_id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Join room error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join room")


@router.post("/{room_id}/leave")
async def leave_video_room(
    room_id: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Leave a video interview room."""
    try:
        service = get_interview_service()
        
        result = await service.leave_room(
            room_id=room_id,
            user_id=current_user.id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Leave room error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to leave room")


@router.post("/{room_id}/signal")
async def send_signaling_message(
    room_id: str,
    message: SignalingMessage,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """
    Send a WebRTC signaling message (offer/answer/ICE candidate).
    
    Used for establishing peer-to-peer video connections.
    """
    try:
        service = get_interview_service()
        
        result = await service.handle_signaling(
            room_id=room_id,
            from_user_id=current_user.id,
            to_user_id=message.to_user_id,
            signal_type=message.signal_type,
            signal_data=message.data
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Signaling error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signaling failed")


@router.get("/{room_id}/signals")
async def get_pending_signals(
    room_id: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get pending signaling messages for the current user."""
    try:
        service = get_interview_service()
        
        messages = await service.get_pending_signals(current_user.id)
        
        return {
            "messages": messages,
            "count": len(messages)
        }
        
    except Exception as e:
        logger.error(f"Get signals error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get signals")


@router.post("/{room_id}/media")
async def toggle_media(
    room_id: str,
    request: MediaToggleRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Toggle video/audio/screen sharing."""
    try:
        service = get_interview_service()
        
        result = await service.toggle_media(
            room_id=room_id,
            user_id=current_user.id,
            media_type=request.media_type,
            enabled=request.enabled
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Toggle media error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle media")


# ============================================================================
# Recording Endpoints
# ============================================================================

@router.post("/{room_id}/recording/start")
async def start_recording(
    room_id: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """
    Start recording the interview.
    
    Only the host (client) can start recording.
    All participants will be notified.
    """
    try:
        service = get_interview_service()
        
        result = await service.start_recording(
            room_id=room_id,
            user_id=current_user.id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Start recording error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start recording")


@router.post("/{room_id}/recording/stop")
async def stop_recording(
    room_id: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Stop recording the interview."""
    try:
        service = get_interview_service()
        
        result = await service.stop_recording(
            room_id=room_id,
            user_id=current_user.id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Stop recording error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to stop recording")


# ============================================================================
# Feedback Endpoints
# ============================================================================

@router.post("/{room_id}/feedback")
async def submit_feedback(
    room_id: str,
    request: FeedbackRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Submit feedback after an interview."""
    try:
        service = get_interview_service()
        
        result = await service.submit_interview_feedback(
            room_id=room_id,
            user_id=current_user.id,
            rating=request.rating,
            notes=request.notes,
            would_hire=request.would_hire,
            skills_demonstrated=request.skills_demonstrated
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Submit feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")


@router.get("/analytics/me")
async def get_interview_analytics(
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get interview analytics for the current user."""
    try:
        service = get_interview_service()
        
        analytics = await service.get_interview_analytics(current_user.id)
        
        return analytics
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")


# ============================================================================
# WebSocket Endpoint for Real-time Signaling
# ============================================================================

@router.websocket("/ws/{room_id}")
async def websocket_signaling(
    websocket: WebSocket,
    room_id: str,
    token: str,
    
):
    """
    WebSocket endpoint for real-time WebRTC signaling.
    
    Handles:
    - offer: SDP offer from caller
    - answer: SDP answer from callee
    - ice-candidate: ICE candidate exchange
    - media-toggle: Video/audio toggle notifications
    """
    await websocket.accept()
    
    signaling_server = get_signaling_server()
    interview_service = get_interview_service()
    
    socket_id = None
    user_id = None
    
    try:
        # Validate token and get user info (simplified)
        # In production, would properly validate JWT token
        interview = await interview_service.get_interview(room_id)
        if not interview:
            await websocket.close(code=4001, reason="Interview not found")
            return
        
        # Determine user from token
        if token == interview["tokens"]["client"]:
            user_id = interview["client_id"]
        elif token == interview["tokens"]["freelancer"]:
            user_id = interview["freelancer_id"]
        else:
            await websocket.close(code=4002, reason="Invalid token")
            return
        
        # Register connection
        import secrets
        socket_id = secrets.token_urlsafe(16)
        
        reg_result = await signaling_server.register_connection(
            socket_id=socket_id,
            user_id=user_id,
            room_id=room_id
        )
        
        # Notify other participants
        other_sockets = await signaling_server.broadcast_to_room(
            room_id=room_id,
            exclude_socket=socket_id,
            message_type="participant-joined",
            data={"user_id": user_id, "socket_id": socket_id}
        )
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "socket_id": socket_id,
            "user_id": user_id,
            "other_participants": reg_result["other_participants"]
        })
        
        # Message loop
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            if msg_type in ["offer", "answer", "ice-candidate"]:
                # Route signaling message to target
                to_socket = message.get("to_socket")
                if to_socket:
                    route_result = await signaling_server.route_signal(
                        from_socket=socket_id,
                        to_socket=to_socket,
                        signal_type=msg_type,
                        data=message.get("data", {})
                    )
                    # In production, would send to target WebSocket
                    # For now, just acknowledge
                    await websocket.send_json({
                        "type": "signal-sent",
                        "to_socket": to_socket
                    })
            
            elif msg_type == "media-toggle":
                # Notify others of media state change
                await interview_service.toggle_media(
                    room_id=room_id,
                    user_id=user_id,
                    media_type=message.get("media_type"),
                    enabled=message.get("enabled")
                )
                # Broadcast to room
                await websocket.send_json({
                    "type": "media-toggled",
                    "user_id": user_id,
                    "media_type": message.get("media_type"),
                    "enabled": message.get("enabled")
                })
            
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {socket_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        if socket_id:
            await signaling_server.unregister_connection(socket_id)
            if user_id:
                await interview_service.leave_room(room_id, user_id)
