# @AI-HINT: Real-time notification system using WebSockets for instant updates
"""
Real-Time Notification System with WebSockets
Provides instant push notifications for bids, messages, payments, and other events
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Set, List, Optional
from datetime import datetime, timezone
import json
import asyncio
from collections import defaultdict

from app.models.notification import Notification
from app.core.security import decode_token, get_current_active_user, require_admin
from app.models.user import User
import logging

logger = logging.getLogger("megilance")


router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications"""
    
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = defaultdict(set)
        # Track online status
        self.online_users: Set[int] = set()
        # Typing indicators: conversation_id -> set of user_ids
        self.typing_users: Dict[int, Set[int]] = defaultdict(set)
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[user_id].add(websocket)
        self.online_users.add(user_id)
        
        # Broadcast user came online
        await self.broadcast_user_status(user_id, "online")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove WebSocket connection and update online status"""
        if websocket in self.active_connections[user_id]:
            self.active_connections[user_id].remove(websocket)
        
        # If no more connections for this user, mark offline
        if not self.active_connections[user_id]:
            self.online_users.discard(user_id)
            asyncio.create_task(self.broadcast_user_status(user_id, "offline"))
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to a specific user's all active connections"""
        if user_id in self.active_connections:
            message_json = json.dumps(message)
            disconnected = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    # Connection is dead, mark for removal
                    disconnected.add(connection)
            
            # Clean up dead connections
            for conn in disconnected:
                self.disconnect(conn, user_id)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected users"""
        message_json = json.dumps(message)
        for user_id in list(self.active_connections.keys()):
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_text(message_json)
                except (json.JSONDecodeError, ValueError):
                    self.disconnect(connection, user_id)
    
    async def broadcast_user_status(self, user_id: int, status: str):
        """Broadcast user's online/offline status"""
        message = {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.broadcast(message)
    
    async def broadcast_typing(self, conversation_id: int, user_id: int, is_typing: bool):
        """Broadcast typing indicator"""
        if is_typing:
            self.typing_users[conversation_id].add(user_id)
        else:
            self.typing_users[conversation_id].discard(user_id)
        
        message = {
            "type": "typing_indicator",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Send to all participants in the conversation
        # In a real implementation, you'd query conversation participants
        await self.broadcast(message)
    
    def get_online_users(self) -> List[int]:
        """Get list of currently online user IDs"""
        return list(self.online_users)
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is online"""
        return user_id in self.online_users
    
    async def send_notification(self, notification: dict, user_id: int):
        """Send a notification to a specific user"""
        message = {
            "type": "notification",
            "data": notification,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.send_personal_message(message, user_id)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for real-time notifications
    
    Client should connect with: ws://localhost:8000/api/realtime/notifications?token=<jwt_token>
    
    Message types:
    - notification: New notification
    - user_status: User online/offline
    - typing_indicator: User is typing
    - read_receipt: Message read confirmation
    """
    
    # Authenticate user from token
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        user_id = int(user_id)
    except (ValueError, KeyError):
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Connect user
    await manager.connect(websocket, user_id)
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "online_users": manager.get_online_users()
        })
        
        # Listen for messages from client
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "typing":
                # Client is typing
                conversation_id = message.get("conversation_id")
                is_typing = message.get("is_typing", True)
                await manager.broadcast_typing(conversation_id, user_id, is_typing)
            
            elif message.get("type") == "ping":
                # Heartbeat to keep connection alive
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            elif message.get("type") == "read_receipt":
                # Mark message as read
                message_id = message.get("message_id")
                # Broadcast read receipt to sender
                await manager.broadcast({
                    "type": "read_receipt",
                    "message_id": message_id,
                    "read_by": user_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info("User %s disconnected from WebSocket", user_id)
    except Exception as e:
        logger.error("WebSocket error for user %s: %s", user_id, e, exc_info=True)
        manager.disconnect(websocket, user_id)


@router.get("/online-users")
async def get_online_users(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of currently online users"""
    return {
        "online_users": manager.get_online_users(),
        "count": len(manager.get_online_users())
    }


@router.get("/user-status/{user_id}")
async def get_user_status(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Check if a specific user is online"""
    return {
        "user_id": user_id,
        "is_online": manager.is_user_online(user_id)
    }


@router.post("/send-notification")
async def send_realtime_notification(
    user_id: int,
    notification: dict,
    current_user: User = Depends(get_current_active_user),
    _admin = Depends(require_admin),
    
):
    """
    Send a real-time notification to a user
    (Internal API for server-side notification triggers)
    """
    # Save to database
    db_notification = Notification(
        user_id=user_id,
        notification_type=notification.get("type", "general"),
        title=notification.get("title", ""),
        content=notification.get("content", ""),
        data=json.dumps(notification.get("data", {})),
        priority=notification.get("priority", "normal"),
        is_read=False
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    # Send via WebSocket if user is online
    await manager.send_notification(
        {
            "id": db_notification.id,
            "type": db_notification.notification_type,
            "title": db_notification.title,
            "content": db_notification.content,
            "priority": db_notification.priority,
            "created_at": db_notification.created_at.isoformat()
        },
        user_id
    )
    
    return {
        "status": "sent",
        "notification_id": db_notification.id,
        "delivered": manager.is_user_online(user_id)
    }


@router.post("/broadcast")
async def broadcast_notification(
    notification: dict,
    current_user: User = Depends(get_current_active_user),
    _admin = Depends(require_admin)
):
    """
    Broadcast a notification to all connected users (admin only).
    """
    await manager.broadcast({
        "type": "broadcast",
        "data": notification,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "broadcasted",
        "recipient_count": len(manager.get_online_users())
    }


# Helper function to send notifications from other parts of the app
async def notify_user(user_id: int, notification_type: str, title: str, content: str, data: dict = None):
    """
    Helper function to send real-time notifications
    Can be called from anywhere in the application
    """
    notification = {
        "type": notification_type,
        "title": title,
        "content": content,
        "data": data or {},
        "priority": "normal"
    }
    
    await manager.send_notification(notification, user_id)


# Export the manager for use in other modules
__all__ = ["router", "manager", "notify_user"]
