# @AI-HINT: Content moderation API endpoints
"""
Moderation API - Content safety and reporting endpoints.

Features:
- Moderate content
- Report violations
- View user reputation
- Admin moderation tools
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.core.security import get_current_active_user, require_admin
from app.models.user import User
from app.services.moderation import (
    get_moderation_service,
    ModerationContentType,
    ViolationType,
    ReportStatus
)

router = APIRouter()


# Request/Response schemas
class ModerateTextRequest(BaseModel):
    """Moderate text request."""
    text: str
    content_type: str
    context: Optional[dict] = None


class ReportContentRequest(BaseModel):
    """Report content request."""
    reported_user_id: int
    content_type: str
    content_id: str
    violation_type: str
    description: str


class ResolveReportRequest(BaseModel):
    """Resolve report request."""
    resolution: str
    moderator_notes: Optional[str] = None
    take_action: bool = False


# API Endpoints
@router.post("/check")
async def check_content(
    request: ModerateTextRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Check content for violations."""
    service = get_moderation_service()
    
    try:
        content_type = ModerationContentType(request.content_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content type. Use: {[t.value for t in ModerationContentType]}"
        )
    
    result = await service.moderate_text(
        text=request.text,
        content_type=content_type,
        user_id=current_user.id,
        context=request.context
    )
    
    return result


@router.post("/report")
async def report_content(
    request: ReportContentRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Report content violation."""
    service = get_moderation_service()
    
    try:
        content_type = ModerationContentType(request.content_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content type"
        )
    
    try:
        violation_type = ViolationType(request.violation_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid violation type. Use: {[v.value for v in ViolationType]}"
        )
    
    # Prevent self-reporting
    if request.reported_user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot report yourself"
        )
    
    report = await service.report_content(
        reporter_id=current_user.id,
        reported_user_id=request.reported_user_id,
        content_type=content_type,
        content_id=request.content_id,
        violation_type=violation_type,
        description=request.description
    )
    
    return report


@router.get("/reports/my")
async def get_my_reports(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get reports I've submitted."""
    service = get_moderation_service()
    
    reports = list(service._reports.values())
    reports = [r for r in reports if r["reporter_id"] == current_user.id]
    
    if status:
        try:
            report_status = ReportStatus(status)
            reports = [r for r in reports if r["status"] == report_status.value]
        except ValueError:
            pass
    
    return {"reports": reports, "count": len(reports)}


@router.get("/reputation")
async def get_my_reputation(
    current_user: User = Depends(get_current_active_user)
):
    """Get my reputation score."""
    service = get_moderation_service()
    
    reputation = await service.get_user_reputation(current_user.id)
    
    return reputation


@router.get("/reputation/{user_id}")
async def get_user_reputation(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get another user's reputation (limited info)."""
    service = get_moderation_service()
    
    reputation = await service.get_user_reputation(user_id)
    
    # Only return limited info for other users
    return {
        "user_id": user_id,
        "trust_level": reputation["trust_level"],
        "is_blocked": reputation["is_blocked"]
    }


@router.get("/violation-types")
async def get_violation_types(
):
    """Get list of violation types."""
    return {
        "violation_types": [
            {"value": v.value, "label": v.value.replace("_", " ").title()}
            for v in ViolationType
        ]
    }


@router.get("/content-types")
async def get_content_types(
):
    """Get list of content types."""
    return {
        "content_types": [
            {"value": c.value, "label": c.value.replace("_", " ").title()}
            for c in ModerationContentType
        ]
    }


# Admin endpoints
@router.get("/admin/reports")
async def admin_list_reports(
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 50,
    current_user: User = Depends(require_admin)
):
    """List all reports (admin only)."""
    
    service = get_moderation_service()
    
    report_status = None
    if status:
        try:
            report_status = ReportStatus(status)
        except ValueError:
            pass
    
    reports = await service.list_reports(
        status=report_status,
        user_id=user_id,
        limit=limit
    )
    
    return {"reports": reports, "count": len(reports)}


@router.get("/admin/reports/{report_id}")
async def admin_get_report(
    report_id: str,
    current_user: User = Depends(require_admin)
):
    """Get report details (admin only)."""
    
    service = get_moderation_service()
    
    report = await service.get_report(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.post("/admin/reports/{report_id}/resolve")
async def admin_resolve_report(
    report_id: str,
    request: ResolveReportRequest,
    current_user: User = Depends(require_admin)
):
    """Resolve a report (admin only)."""
    
    service = get_moderation_service()
    
    report = await service.resolve_report(
        report_id=report_id,
        resolution=request.resolution,
        moderator_notes=request.moderator_notes,
        take_action=request.take_action
    )
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.get("/admin/stats")
async def admin_get_stats(
    current_user: User = Depends(require_admin)
):
    """Get moderation statistics (admin only)."""
    
    service = get_moderation_service()
    
    stats = await service.get_moderation_stats()
    
    return stats


@router.post("/admin/block/{user_id}")
async def admin_block_user(
    user_id: int,
    days: int = 7,
    current_user: User = Depends(require_admin)
):
    """Block a user (admin only)."""
    
    from datetime import timedelta, timezone
    
    service = get_moderation_service()
    
    service._blocked_users[user_id] = datetime.now(timezone.utc) + timedelta(days=days)
    
    return {
        "user_id": user_id,
        "blocked_for_days": days,
        "status": "blocked"
    }


@router.post("/admin/unblock/{user_id}")
async def admin_unblock_user(
    user_id: int,
    current_user: User = Depends(require_admin)
):
    """Unblock a user (admin only)."""
    
    from datetime import datetime
    
    service = get_moderation_service()
    
    if user_id in service._blocked_users:
        del service._blocked_users[user_id]
        return {"user_id": user_id, "status": "unblocked"}
    
    return {"user_id": user_id, "status": "not_blocked"}
