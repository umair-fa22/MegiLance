# @AI-HINT: API endpoints for AI chatbot and support automation
"""
AI Chatbot API - Intelligent conversational support system.

Endpoints for:
- Starting conversations
- Sending messages
- FAQ search
- Creating support tickets
- Managing conversations
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.services.ai_chatbot import get_chatbot_service

router = APIRouter(tags=["chatbot"])


# Request/Response Models
class StartConversationRequest(BaseModel):
    context: Optional[dict] = None


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    priority: str = "medium"
    category: Optional[str] = None


class CloseConversationRequest(BaseModel):
    resolution: Optional[str] = None


class FAQSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    category: Optional[str] = None
    limit: int = 5


# Endpoints
@router.post("/start")
async def start_conversation(
    request: Optional[StartConversationRequest] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    
):
    """Start a new chatbot conversation."""
    service = get_chatbot_service()
    
    user_id = current_user.id if current_user else None
    context = request.context if request else None
    
    result = await service.start_conversation(
        user_id=user_id,
        context=context
    )
    
    return result


@router.post("/{conversation_id}/message")
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    
):
    """Send a message in a chatbot conversation."""
    service = get_chatbot_service()
    
    user_id = current_user.id if current_user else None
    
    result = await service.send_message(
        conversation_id=conversation_id,
        message=request.message,
        user_id=user_id
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.get("/{conversation_id}/history")
async def get_conversation_history(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get conversation history."""
    service = get_chatbot_service()
    
    result = await service.get_conversation_history(conversation_id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Verify ownership
    conv_user_id = result.get("conversation", {}).get("user_id")
    if conv_user_id is not None and conv_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return result


@router.post("/{conversation_id}/close")
async def close_conversation(
    conversation_id: str,
    request: Optional[CloseConversationRequest] = None,
    current_user: User = Depends(get_current_active_user),
    
):
    """Close a chatbot conversation."""
    service = get_chatbot_service()
    
    # Verify conversation exists and ownership
    history = await service.get_conversation_history(conversation_id)
    if "error" in history:
        raise HTTPException(status_code=404, detail=history["error"])
    conv_user_id = history.get("conversation", {}).get("user_id")
    if conv_user_id is not None and conv_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    resolution = request.resolution if request else None
    
    result = await service.close_conversation(
        conversation_id=conversation_id,
        resolution=resolution
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.post("/faq/search")
async def search_faq(
    request: FAQSearchRequest,
    
):
    """Search FAQ database."""
    service = get_chatbot_service()
    
    results = await service.search_faq(
        query=request.query,
        category=request.category,
        limit=request.limit
    )
    
    return {"results": results, "count": len(results)}


@router.get("/faq/categories")
async def get_faq_categories(
    
):
    """Get FAQ categories."""
    service = get_chatbot_service()
    
    categories = set()
    for faq in service.FAQ_DATABASE.values():
        categories.add(faq["category"])
    
    return {"categories": sorted(list(categories))}


@router.post("/{conversation_id}/ticket")
async def create_support_ticket(
    conversation_id: str,
    request: CreateTicketRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Create a support ticket from conversation."""
    service = get_chatbot_service()
    
    result = await service.create_support_ticket(
        conversation_id=conversation_id,
        user_id=current_user.id,
        subject=request.subject,
        description=request.description,
        priority=request.priority,
        category=request.category
    )
    
    return result


@router.get("/ticket/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get support ticket details."""
    service = get_chatbot_service()
    
    ticket = await service.get_ticket(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify ownership
    if ticket["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket
