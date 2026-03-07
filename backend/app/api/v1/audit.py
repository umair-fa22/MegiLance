# @AI-HINT: API endpoints for audit trail and compliance logging
"""
Audit Trail API - Comprehensive audit logging and compliance.

Endpoints for:
- Viewing audit logs
- User activity reports
- Security alerts
- Log export
- Integrity verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_active_user, require_admin
from app.models.user import User
from app.services.db_utils import get_user_role
from app.services.audit_trail import (
    get_audit_service,
    AuditCategory,
    AuditAction,
    AuditSeverity
)

router = APIRouter(prefix="/audit", tags=["audit"])


# Request/Response Models
class AuditLogQuery(BaseModel):
    user_id: Optional[int] = None
    category: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    severity: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    ip_address: Optional[str] = None
    limit: int = 100
    offset: int = 0


class ExportLogsRequest(BaseModel):
    format: str = "json"
    filters: Optional[dict] = None
    include_hashes: bool = False


# Endpoints
@router.get("/logs")
async def get_audit_logs(
    user_id: Optional[int] = None,
    category: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_admin),
    
):
    """Get audit logs with filters (admin only)."""
    
    service = get_audit_service()
    
    # Parse enums
    category_enum = None
    if category:
        try:
            category_enum = AuditCategory(category)
        except ValueError:
            pass
    
    action_enum = None
    if action:
        try:
            action_enum = AuditAction(action)
        except ValueError:
            pass
    
    severity_enum = None
    if severity:
        try:
            severity_enum = AuditSeverity(severity)
        except ValueError:
            pass
    
    result = await service.get_logs(
        user_id=user_id,
        category=category_enum,
        action=action_enum,
        resource_type=resource_type,
        severity=severity_enum,
        limit=limit,
        offset=offset
    )
    
    return result


@router.get("/users/{user_id}/activity")
async def get_user_activity(
    user_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get user activity summary."""
    # Users can view their own, admins can view any
    if current_user.id != user_id:
        if get_user_role(current_user) != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required to view other users' activity")
    
    service = get_audit_service()
    
    result = await service.get_user_activity(
        user_id=user_id,
        days=days
    )
    
    return result


@router.get("/my-activity")
async def get_my_activity(
    days: int = 30,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get current user's activity summary."""
    service = get_audit_service()
    
    result = await service.get_user_activity(
        user_id=current_user.id,
        days=days
    )
    
    return result


@router.get("/statistics")
async def get_statistics(
    days: int = 30,
    current_user: User = Depends(require_admin),
    
):
    """Get audit log statistics (admin only)."""
    service = get_audit_service()
    
    result = await service.get_statistics(days=days)
    
    return result


@router.get("/security-alerts")
async def get_security_alerts(
    hours: int = 24,
    current_user: User = Depends(require_admin),
    
):
    """Get recent security alerts (admin only)."""
    service = get_audit_service()
    
    result = await service.get_security_alerts(hours=hours)
    
    return result


@router.post("/export")
async def export_logs(
    request: ExportLogsRequest,
    current_user: User = Depends(require_admin),
    
):
    """Export audit logs for compliance (admin only)."""
    service = get_audit_service()
    
    result = await service.export_logs(
        format=request.format,
        filters=request.filters,
        include_hashes=request.include_hashes
    )
    
    return result


@router.post("/verify-integrity")
async def verify_integrity(
    start_index: int = 0,
    end_index: Optional[int] = None,
    current_user: User = Depends(require_admin),
    
):
    """Verify audit log integrity (admin only)."""
    service = get_audit_service()
    
    result = await service.verify_integrity(
        start_index=start_index,
        end_index=end_index
    )
    
    return result


@router.post("/cleanup")
async def cleanup_old_logs(
    category: Optional[str] = None,
    current_user: User = Depends(require_admin),
    
):
    """Clean up logs past retention period (admin only)."""
    service = get_audit_service()
    
    category_enum = None
    if category:
        try:
            category_enum = AuditCategory(category)
        except ValueError:
            pass
    
    result = await service.cleanup_old_logs(category=category_enum)
    
    return result


@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_active_user),
    
):
    """Get available audit categories."""
    return {
        "categories": [c.value for c in AuditCategory],
        "actions": [a.value for a in AuditAction],
        "severities": [s.value for s in AuditSeverity]
    }
