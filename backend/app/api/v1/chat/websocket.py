# @AI-HINT: WebSocket API endpoints for real-time features status and testing - Turso HTTP only
# Provides endpoints to check online users, active connections, and WebSocket health

from fastapi import APIRouter, Depends
from typing import List

from app.core.security import get_current_active_user, require_admin
from app.core.websocket import websocket_manager
from pydantic import BaseModel


router = APIRouter()


class OnlineUsersResponse(BaseModel):
    """Response with online users"""
    online_users: List[str]
    count: int


class WebSocketStatusResponse(BaseModel):
    """WebSocket server status"""
    status: str
    active_connections: int
    active_users: int
    project_rooms: int
    chat_rooms: int


class SendNotificationRequest(BaseModel):
    """Request to send a test notification"""
    user_id: str
    title: str
    message: str
    type: str = "info"


@router.get("/status", response_model=WebSocketStatusResponse)
def get_websocket_status(
    current_user = Depends(get_current_active_user),
):
    """
    Get WebSocket server status
    
    Returns information about active connections, users, and rooms.
    """
    return WebSocketStatusResponse(
        status="running",
        active_connections=len(websocket_manager.user_sessions),
        active_users=len(websocket_manager.active_connections),
        project_rooms=len(websocket_manager.project_rooms),
        chat_rooms=len(websocket_manager.chat_rooms)
    )


@router.get("/online-users", response_model=OnlineUsersResponse)
def get_online_users(
    current_user = Depends(get_current_active_user),
):
    """
    Get list of online users
    
    Returns user IDs of all currently connected users.
    """
    online_users = websocket_manager.get_online_users()
    
    return OnlineUsersResponse(
        online_users=online_users,
        count=len(online_users)
    )


@router.get("/user/{user_id}/online")
def check_user_online(
    user_id: str,
    current_user = Depends(get_current_active_user),
):
    """
    Check if a specific user is online
    """
    is_online = websocket_manager.is_user_online(user_id)
    
    return {
        "user_id": user_id,
        "online": is_online
    }


@router.post("/send-notification")
async def send_test_notification(
    request: SendNotificationRequest,
    current_user = Depends(get_current_active_user),
    _admin = Depends(require_admin),
):
    """
    Send a test notification to a user (admin only).
    """
    notification = {
        "id": "test",
        "title": request.title,
        "message": request.message,
        "type": request.type,
        "user_id": request.user_id
    }
    
    await websocket_manager.send_notification(request.user_id, notification)
    
    return {
        "status": "sent",
        "notification": notification
    }
