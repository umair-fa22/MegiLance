# @AI-HINT: Integrations hub API endpoints
"""
Integrations Hub API - Third-party service integration endpoints.

Features:
- List available integrations
- OAuth connection flow
- Integration settings
- Integration actions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.integrations import get_integrations_service, IntegrationType

router = APIRouter(prefix="/integrations", tags=["integrations"])


# Request/Response Models
class StartOAuthRequest(BaseModel):
    integration_type: IntegrationType
    redirect_uri: str


class CompleteOAuthRequest(BaseModel):
    code: str
    state: str


class UpdateSettingsRequest(BaseModel):
    settings: Dict[str, Any]


class SlackMessageRequest(BaseModel):
    channel: str
    message: str
    attachments: Optional[List[Dict]] = None


class GitHubIssueRequest(BaseModel):
    repo: str
    title: str
    body: str
    labels: Optional[List[str]] = None


class TrelloCardRequest(BaseModel):
    board_id: str
    list_id: str
    name: str
    description: Optional[str] = None


class CalendarSyncRequest(BaseModel):
    events: List[Dict[str, Any]]


# Endpoints
@router.get("")
async def list_available_integrations():
    """List all available integrations."""
    service = get_integrations_service()
    integrations = await service.list_available_integrations()
    return {"integrations": integrations}


@router.get("/connected")
async def get_connected_integrations(
    current_user = Depends(get_current_active_user)
):
    """Get user's connected integrations."""
    service = get_integrations_service()
    integrations = await service.get_user_integrations(current_user["id"])
    return {"integrations": integrations}


@router.get("/{integration_type}")
async def get_integration_details(
    integration_type: IntegrationType,
    current_user = Depends(get_current_active_user)
):
    """Get details for a specific integration."""
    service = get_integrations_service()
    
    config = await service.get_integration_config(integration_type)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    user_integration = await service.get_user_integration(
        current_user["id"], integration_type
    )
    
    return {
        "config": config,
        "user_integration": user_integration,
        "is_connected": user_integration is not None and user_integration.status == "connected"
    }


@router.post("/oauth/start")
async def start_oauth_flow(
    request: StartOAuthRequest,
    current_user = Depends(get_current_active_user)
):
    """Start OAuth flow for an integration."""
    service = get_integrations_service()
    
    try:
        result = await service.start_oauth(
            user_id=current_user["id"],
            integration_type=request.integration_type,
            redirect_uri=request.redirect_uri
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Internal server error"
        )


@router.post("/oauth/complete")
async def complete_oauth_flow(
    request: CompleteOAuthRequest,
    current_user = Depends(get_current_active_user)
):
    """Complete OAuth flow and connect integration."""
    service = get_integrations_service()
    
    integration = await service.complete_oauth(
        code=request.code,
        state=request.state
    )
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state"
        )
    
    return {"integration": integration, "message": "Integration connected successfully"}


@router.delete("/{integration_type}")
async def disconnect_integration(
    integration_type: IntegrationType,
    current_user = Depends(get_current_active_user)
):
    """Disconnect an integration."""
    service = get_integrations_service()
    
    success = await service.disconnect_integration(
        current_user["id"], integration_type
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    return {"message": "Integration disconnected"}


@router.put("/{integration_type}/settings")
async def update_integration_settings(
    integration_type: IntegrationType,
    request: UpdateSettingsRequest,
    current_user = Depends(get_current_active_user)
):
    """Update integration settings."""
    service = get_integrations_service()
    
    integration = await service.update_integration_settings(
        user_id=current_user["id"],
        integration_type=integration_type,
        settings=request.settings
    )
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    return {"integration": integration, "message": "Settings updated"}


@router.post("/{integration_type}/test")
async def test_integration(
    integration_type: IntegrationType,
    current_user = Depends(get_current_active_user)
):
    """Test an integration connection."""
    service = get_integrations_service()
    
    result = await service.test_integration(
        current_user["id"], integration_type
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Test failed")
        )
    
    return result


# Integration-specific endpoints

@router.post("/slack/message")
async def send_slack_message(
    request: SlackMessageRequest,
    current_user = Depends(get_current_active_user)
):
    """Send a message to Slack."""
    service = get_integrations_service()
    
    result = await service.send_slack_message(
        user_id=current_user["id"],
        channel=request.channel,
        message=request.message,
        attachments=request.attachments
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to send message")
        )
    
    return result


@router.post("/github/issue")
async def create_github_issue(
    request: GitHubIssueRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a GitHub issue."""
    service = get_integrations_service()
    
    result = await service.create_github_issue(
        user_id=current_user["id"],
        repo=request.repo,
        title=request.title,
        body=request.body,
        labels=request.labels
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create issue")
        )
    
    return result


@router.post("/trello/card")
async def create_trello_card(
    request: TrelloCardRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a Trello card."""
    service = get_integrations_service()
    
    result = await service.create_trello_card(
        user_id=current_user["id"],
        board_id=request.board_id,
        list_id=request.list_id,
        name=request.name,
        description=request.description
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create card")
        )
    
    return result


@router.post("/google-calendar/sync")
async def sync_google_calendar(
    request: CalendarSyncRequest,
    current_user = Depends(get_current_active_user)
):
    """Sync events to Google Calendar."""
    service = get_integrations_service()
    
    result = await service.sync_google_calendar(
        user_id=current_user["id"],
        events=request.events
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to sync calendar")
        )
    
    return result
