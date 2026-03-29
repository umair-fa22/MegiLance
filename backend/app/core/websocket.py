# @AI-HINT: WebSocket manager for real-time features using Socket.IO
# Handles real-time messaging, notifications, typing indicators, online status, and project updates

import logging
import socketio
from typing import Dict, Set, Optional, List
from datetime import datetime, timezone
import os
logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manager for WebSocket connections and real-time events"""
    
    def __init__(self):
        # Initialize Socket.IO server with environment-based CORS
        allowed_origins = os.environ.get(
            "WEBSOCKET_CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,https://megilance.site,https://www.megilance.site"
        ).split(",")
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins=allowed_origins,
            logger=True,
            engineio_logger=True
        )
        
        # Connection tracking
        self.active_connections: Dict[str, Set[str]] = {}  # user_id -> set of session_ids
        self.user_sessions: Dict[str, str] = {}  # session_id -> user_id
        
        # Room tracking
        self.project_rooms: Dict[int, Set[str]] = {}  # project_id -> set of session_ids
        self.chat_rooms: Dict[str, Set[str]] = {}  # chat_id -> set of session_ids
        
        self._register_events()
    
    def _register_events(self):
        """Register Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            logger.info(f"Client connected: {sid}")
            
            # Extract user_id from auth
            user_id = auth.get('user_id') if auth else None
            if user_id:
                await self.add_user_connection(sid, str(user_id))
            
            return True
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            logger.info(f"Client disconnected: {sid}")
            await self.remove_user_connection(sid)
        
        @self.sio.event
        async def join_project(sid, data):
            """Join a project room for updates"""
            project_id = data.get('project_id')
            if project_id:
                await self.join_project_room(sid, project_id)
                await self.sio.emit('project_joined', {'project_id': project_id}, room=sid)
        
        @self.sio.event
        async def leave_project(sid, data):
            """Leave a project room"""
            project_id = data.get('project_id')
            if project_id:
                await self.leave_project_room(sid, project_id)
                await self.sio.emit('project_left', {'project_id': project_id}, room=sid)
        
        @self.sio.event
        async def join_chat(sid, data):
            """Join a chat room for messaging"""
            chat_id = data.get('chat_id')
            if chat_id:
                await self.join_chat_room(sid, str(chat_id))
                await self.sio.emit('chat_joined', {'chat_id': chat_id}, room=sid)
        
        @self.sio.event
        async def leave_chat(sid, data):
            """Leave a chat room"""
            chat_id = data.get('chat_id')
            if chat_id:
                await self.leave_chat_room(sid, str(chat_id))
                await self.sio.emit('chat_left', {'chat_id': chat_id}, room=sid)
        
        @self.sio.event
        async def typing_start(sid, data):
            """Broadcast typing indicator"""
            chat_id = data.get('chat_id')
            user_id = self.user_sessions.get(sid)
            
            if chat_id and user_id:
                await self.broadcast_to_chat(
                    str(chat_id),
                    'user_typing',
                    {'user_id': user_id, 'typing': True},
                    exclude_sid=sid
                )
        
        @self.sio.event
        async def typing_stop(sid, data):
            """Stop typing indicator"""
            chat_id = data.get('chat_id')
            user_id = self.user_sessions.get(sid)
            
            if chat_id and user_id:
                await self.broadcast_to_chat(
                    str(chat_id),
                    'user_typing',
                    {'user_id': user_id, 'typing': False},
                    exclude_sid=sid
                )
        
        @self.sio.event
        async def send_message(sid, data):
            """Handle real-time message sending"""
            chat_id = data.get('chat_id')
            message = data.get('message')
            user_id = self.user_sessions.get(sid)
            
            if chat_id and message and user_id:
                payload = {
                    'chat_id': chat_id,
                    'message': message,
                    'user_id': user_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
                # Forward any additional metadata (like attachment_url, sender_name)
                for key, value in data.items():
                    if key not in ['chat_id', 'message']:
                        payload[key] = value

                await self.broadcast_to_chat(
                    str(chat_id),
                    'new_message',
                    payload,
                    exclude_sid=sid
                )
    
    # ===== Connection Management =====
    
    async def add_user_connection(self, session_id: str, user_id: str):
        """Add a user connection"""
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(session_id)
        self.user_sessions[session_id] = user_id
        
        # Broadcast user online status
        await self.broadcast_user_status(user_id, 'online')
    
    async def remove_user_connection(self, session_id: str):
        """Remove a user connection"""
        user_id = self.user_sessions.get(session_id)
        
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].discard(session_id)
            
            # If no more connections, user is offline
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                await self.broadcast_user_status(user_id, 'offline')
        
        if session_id in self.user_sessions:
            del self.user_sessions[session_id]
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_online_users(self) -> List[str]:
        """Get list of online user IDs"""
        return list(self.active_connections.keys())
    
    # ===== Room Management =====
    
    async def join_project_room(self, session_id: str, project_id: int):
        """Join a project room"""
        room_name = f"project_{project_id}"
        await self.sio.enter_room(session_id, room_name)
        
        if project_id not in self.project_rooms:
            self.project_rooms[project_id] = set()
        self.project_rooms[project_id].add(session_id)
    
    async def leave_project_room(self, session_id: str, project_id: int):
        """Leave a project room"""
        room_name = f"project_{project_id}"
        await self.sio.leave_room(session_id, room_name)
        
        if project_id in self.project_rooms:
            self.project_rooms[project_id].discard(session_id)
    
    async def join_chat_room(self, session_id: str, chat_id: str):
        """Join a chat room"""
        room_name = f"chat_{chat_id}"
        await self.sio.enter_room(session_id, room_name)
        
        if chat_id not in self.chat_rooms:
            self.chat_rooms[chat_id] = set()
        self.chat_rooms[chat_id].add(session_id)
    
    async def leave_chat_room(self, session_id: str, chat_id: str):
        """Leave a chat room"""
        room_name = f"chat_{chat_id}"
        await self.sio.leave_room(session_id, room_name)
        
        if chat_id in self.chat_rooms:
            self.chat_rooms[chat_id].discard(session_id)
    
    # ===== Broadcasting =====
    
    async def broadcast_to_user(self, user_id: str, event: str, data: dict):
        """Send event to all sessions of a specific user"""
        if user_id in self.active_connections:
            for session_id in self.active_connections[user_id]:
                await self.sio.emit(event, data, room=session_id)
    
    async def broadcast_to_project(self, project_id: int, event: str, data: dict):
        """Broadcast event to all users in a project room"""
        room_name = f"project_{project_id}"
        await self.sio.emit(event, data, room=room_name)
    
    async def broadcast_to_chat(
        self, 
        chat_id: str, 
        event: str, 
        data: dict,
        exclude_sid: Optional[str] = None
    ):
        """Broadcast event to all users in a chat room"""
        room_name = f"chat_{chat_id}"
        await self.sio.emit(event, data, room=room_name, skip_sid=exclude_sid)
    
    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user online/offline status"""
        await self.sio.emit('user_status', {
            'user_id': user_id,
            'status': status,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    # ===== Notification Events =====
    
    async def send_notification(self, user_id: str, notification: dict):
        """Send real-time notification to user"""
        await self.broadcast_to_user(user_id, 'notification', notification)
    
    async def send_message_notification(self, user_id: str, message: dict):
        """Send new message notification"""
        await self.broadcast_to_user(user_id, 'new_message', message)
    
    async def send_project_update(self, project_id: int, update: dict):
        """Send project update to all project members"""
        await self.broadcast_to_project(project_id, 'project_update', update)
    
    async def send_proposal_update(self, user_id: str, proposal: dict):
        """Send proposal status update"""
        await self.broadcast_to_user(user_id, 'proposal_update', proposal)
    
    async def send_milestone_update(self, project_id: int, milestone: dict):
        """Send milestone update to project members"""
        await self.broadcast_to_project(project_id, 'milestone_update', milestone)
    
    async def send_payment_notification(self, user_id: str, payment: dict):
        """Send payment notification"""
        await self.broadcast_to_user(user_id, 'payment_received', payment)


# Singleton instance
websocket_manager = WebSocketManager()


# ASGI app for Socket.IO
socket_app = socketio.ASGIApp(
    websocket_manager.sio,
    socketio_path='socket.io'
)
