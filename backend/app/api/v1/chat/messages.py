# @AI-HINT: Messages and conversations API - uses service layer for all DB operations
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator
import logging

from app.core.security import get_current_user_from_token
from app.services import messages_service
from app.services.db_utils import paginate_params
from app.api.v1.core_domain.utils import SCRIPT_PATTERN, moderate_content

router = APIRouter()
logger = logging.getLogger(__name__)

# Validation constants
MAX_MESSAGE_LENGTH = 10000
MAX_CONTENT_LENGTH = 50000
VALID_MESSAGE_TYPES = {"text", "file", "image", "system"}
VALID_CONVERSATION_STATUSES = {"active", "closed", "blocked"}


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


# Pydantic models for request validation
class ConversationCreate(BaseModel):
    client_id: int = Field(..., gt=0)
    freelancer_id: int = Field(..., gt=0)
    project_id: Optional[int] = Field(None, gt=0)


class ConversationUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern=r'^(active|closed|blocked)$')
    is_archived: Optional[bool] = None


class MessageCreate(BaseModel):
    conversation_id: Optional[int] = Field(None, gt=0)
    receiver_id: Optional[int] = Field(None, gt=0)
    project_id: Optional[int] = Field(None, gt=0)
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    message_type: str = Field("text", pattern=r'^(text|file|image|system)$')

    @field_validator('content')
    @classmethod
    def sanitize_message_content(cls, v: str) -> str:
        if SCRIPT_PATTERN.search(v):
            raise ValueError("Invalid characters in message content")
        return v.strip()


class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=MAX_MESSAGE_LENGTH)
    is_read: Optional[bool] = None

    @field_validator('content')
    @classmethod
    def sanitize_update_content(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if SCRIPT_PATTERN.search(v):
            raise ValueError("Invalid characters in message content")
        return v.strip()


# Conversation endpoints
@router.post("/conversations", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conversation: ConversationCreate,
    current_user = Depends(get_current_user)
):
    """Create a new conversation"""
    user_id = current_user.get("user_id")
    client_id = conversation.client_id
    freelancer_id = conversation.freelancer_id
    project_id = conversation.project_id

    if user_id not in (client_id, freelancer_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create conversation for other users"
        )

    if client_id == freelancer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create conversation with yourself"
        )

    # Verify both users exist and are active
    for uid in [client_id, freelancer_id]:
        user_data = messages_service.check_user_exists_active(uid)
        if not user_data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {uid} not found")
        if not user_data.get("is_active", False):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {uid} is not active")

    # Check if conversation already exists
    existing = messages_service.find_existing_conversation(client_id, freelancer_id, project_id)
    if existing:
        return existing

    now = datetime.now(timezone.utc).isoformat()

    try:
        new_id = messages_service.create_conversation_record(client_id, freelancer_id, project_id, now)
        if new_id is None:
            raise HTTPException(status_code=500, detail="Failed to create conversation")

        logger.info(f"Conversation {new_id} created between client {client_id} and freelancer {freelancer_id}")

        return {
            "id": new_id,
            "client_id": client_id,
            "freelancer_id": freelancer_id,
            "project_id": project_id,
            "status": "active",
            "is_archived": False,
            "last_message_at": now,
            "created_at": now,
            "updated_at": now
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")


@router.get("/conversations", response_model=List[dict])
def get_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    conv_status: Optional[str] = Query(None, alias="status", pattern=r'^(active|closed|blocked)$'),
    archived: Optional[bool] = Query(None),
    current_user = Depends(get_current_user)
):
    """Get all conversations for current user"""
    offset, limit = paginate_params(page, page_size)
    user_id = current_user.get("user_id")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not authenticated")

    if conv_status and conv_status.lower() not in VALID_CONVERSATION_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_CONVERSATION_STATUSES)}"
        )

    return messages_service.list_conversations_for_user(user_id, conv_status, archived, limit, offset)


@router.get("/conversations/{conversation_id}", response_model=dict)
def get_conversation(
    conversation_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific conversation"""
    user_id = current_user.get("user_id")

    if conversation_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid conversation ID")

    conversation = messages_service.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if conversation.get("client_id") != user_id and conversation.get("freelancer_id") != user_id:
        logger.warning(f"Unauthorized access attempt to conversation {conversation_id} by user {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Add contact info
    other_user_id = conversation["freelancer_id"] if conversation["client_id"] == user_id else conversation["client_id"]
    user_info = messages_service.get_user_public_info(other_user_id)
    if user_info:
        conversation["contact_name"] = user_info.get("full_name", "Unknown")
        conversation["avatar"] = user_info.get("profile_image_url")

    return conversation


@router.patch("/conversations/{conversation_id}", response_model=dict)
def update_conversation(
    conversation_id: int,
    conversation_update: ConversationUpdate,
    current_user = Depends(get_current_user)
):
    """Update a conversation"""
    user_id = current_user.get("user_id")

    if conversation_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid conversation ID")

    participants = messages_service.get_conversation_participants(conversation_id)
    if not participants:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if participants.get("client_id") != user_id and participants.get("freelancer_id") != user_id:
        logger.warning(f"Unauthorized update attempt on conversation {conversation_id} by user {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = conversation_update.model_dump(exclude_unset=True, exclude_none=True)

    if not update_data:
        return get_conversation(conversation_id, current_user)

    updates = []
    params = []

    if "status" in update_data:
        if update_data["status"].lower() not in VALID_CONVERSATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(VALID_CONVERSATION_STATUSES)}"
            )
        updates.append("status = ?")
        params.append(update_data["status"].lower())

    if "is_archived" in update_data:
        updates.append("is_archived = ?")
        params.append(1 if update_data["is_archived"] else 0)

    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(conversation_id)

        try:
            messages_service.update_conversation_fields(conversation_id, ', '.join(updates), params)
            logger.info(f"Conversation {conversation_id} updated by user {user_id}")
        except Exception as e:
            logger.error(f"Failed to update conversation {conversation_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update conversation")

    return get_conversation(conversation_id, current_user)


# Message endpoints
@router.post("/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
def send_message(
    message: MessageCreate,
    current_user = Depends(get_current_user)
):
    """Send a new message"""
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")
    conversation_id = message.conversation_id
    receiver_id = message.receiver_id
    project_id = message.project_id
    content = messages_service.sanitize_content(message.content)
    message_type = message.message_type

    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty")
    
    ok, reason = moderate_content(content)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Message rejected: {reason}")

    if not conversation_id:
        if not receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either conversation_id or receiver_id must be provided"
            )

        if receiver_id == user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send message to yourself")

        # Try to find existing conversation
        conversation_id = messages_service.find_conversation_between(user_id, receiver_id, project_id)

        if not conversation_id:
            # Verify receiver exists and is active
            receiver_data = messages_service.check_user_exists_active(receiver_id)
            if not receiver_data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")
            if not receiver_data.get("is_active"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot message inactive user")

            # Create new conversation
            now = datetime.now(timezone.utc).isoformat()
            if role.lower() == "client":
                client_id = user_id
                freelancer_id = receiver_id
            else:
                client_id = receiver_id
                freelancer_id = user_id

            conversation_id = messages_service.create_conversation_record(client_id, freelancer_id, project_id, now)
    else:
        # Verify user has access to conversation
        conv = messages_service.get_conversation_participants(conversation_id)
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        if conv["client_id"] != user_id and conv["freelancer_id"] != user_id:
            logger.warning(f"Unauthorized message attempt in conversation {conversation_id} by user {user_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        if conv.get("status") == "blocked":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send messages in a blocked conversation")

        if not receiver_id:
            receiver_id = conv["freelancer_id"] if conv["client_id"] == user_id else conv["client_id"]

    if not receiver_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receiver ID could not be determined")

    now = datetime.now(timezone.utc).isoformat()

    try:
        new_id = messages_service.create_message_record(
            conversation_id, user_id, receiver_id, project_id, content, message_type, now
        )
        if new_id is None:
            raise HTTPException(status_code=500, detail="Failed to send message")

        messages_service.update_conversation_timestamp(conversation_id, now)

        logger.info(f"Message {new_id} sent from user {user_id} to user {receiver_id} in conversation {conversation_id}")

        return {
            "id": new_id,
            "conversation_id": conversation_id,
            "sender_id": user_id,
            "receiver_id": receiver_id,
            "project_id": project_id,
            "content": content,
            "message_type": message_type,
            "is_read": False,
            "is_deleted": False,
            "sent_at": now,
            "created_at": now
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.get("/messages", response_model=List[dict])
def get_messages(
    conversation_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Get messages for a conversation"""
    offset, limit = paginate_params(page, page_size)
    user_id = current_user.get("user_id")

    # Verify user has access to conversation
    conv = messages_service.get_conversation_participants(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv.get("client_id") != user_id and conv.get("freelancer_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = messages_service.fetch_conversation_messages(conversation_id, limit, offset)

    now = datetime.now(timezone.utc).isoformat()

    # Mark messages as read
    unread_ids = []
    for msg in messages:
        msg["is_read"] = bool(msg.get("is_read"))
        msg["is_deleted"] = bool(msg.get("is_deleted"))
        if not msg.get("is_read") and msg.get("receiver_id") == user_id:
            unread_ids.append(msg["id"])

    if unread_ids:
        messages_service.mark_messages_read(unread_ids, now)

    # Return in chronological order
    return list(reversed(messages))


@router.get("/messages/{message_id}", response_model=dict)
def get_message(
    message_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific message"""
    user_id = current_user.get("user_id")

    message = messages_service.get_message_by_id(message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.get("sender_id") != user_id and message.get("receiver_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark as read if receiver
    if message.get("receiver_id") == user_id and not message.get("is_read"):
        now = datetime.now(timezone.utc).isoformat()
        messages_service.mark_single_message_read(message_id, now)
        message["is_read"] = True
        message["read_at"] = now

    return message


@router.patch("/messages/{message_id}", response_model=dict)
def update_message(
    message_id: int,
    message_update: MessageUpdate,
    current_user = Depends(get_current_user)
):
    """Update a message"""
    user_id = current_user.get("user_id")

    ownership = messages_service.get_message_ownership(message_id)
    if not ownership:
        raise HTTPException(status_code=404, detail="Message not found")

    if message_update.content is not None and ownership.get("sender_id") != user_id:
        raise HTTPException(status_code=403, detail="Only sender can edit message")

    if message_update.is_read is not None and ownership.get("receiver_id") != user_id:
        raise HTTPException(status_code=403, detail="Only receiver can mark as read")

    updates = []
    params = []

    if message_update.content is not None:
        updates.append("content = ?")
        params.append(messages_service.sanitize_content(message_update.content))

    if message_update.is_read is not None:
        updates.append("is_read = ?")
        params.append(1 if message_update.is_read else 0)
        if message_update.is_read:
            updates.append("read_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())

    if updates:
        params.append(message_id)
        messages_service.update_message_fields(message_id, ', '.join(updates), params)

    # Fetch updated message
    updated = messages_service.get_message_by_id(message_id)
    return updated or {}


@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    current_user = Depends(get_current_user)
):
    """Soft delete a message"""
    user_id = current_user.get("user_id")

    ownership = messages_service.get_message_ownership(message_id)
    if not ownership:
        raise HTTPException(status_code=404, detail="Message not found")

    if ownership.get("sender_id") != user_id:
        raise HTTPException(status_code=403, detail="Only sender can delete message")

    messages_service.soft_delete_message(message_id)
    return {"message": "Message deleted successfully"}


@router.get("/messages/unread/count")
def get_unread_count(
    current_user = Depends(get_current_user)
):
    """Get count of unread messages for current user"""
    user_id = current_user.get("user_id")
    count = messages_service.count_unread_messages(user_id)
    return {"unread_count": count}


@router.get("/messages/search/all")
def search_messages(
    q: str = Query(..., min_length=2, max_length=200, description="Search query"),
    conversation_id: Optional[int] = Query(None, description="Search within a specific conversation"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """
    Search messages across all conversations or within a specific conversation.
    Only searches messages the user has access to.
    """
    offset, limit = paginate_params(page, page_size)
    user_id = current_user.get("user_id")

    if conversation_id:
        # Verify access
        conv = messages_service.get_conversation_participants(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if conv.get("client_id") != user_id and conv.get("freelancer_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return messages_service.search_messages(user_id, q, conversation_id, limit, offset)
