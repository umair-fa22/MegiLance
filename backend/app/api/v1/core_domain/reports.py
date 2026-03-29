# @AI-HINT: Report generation API endpoints
"""
Reports API - PDF/Excel report generation endpoints.

Features:
- Generate various report types
- Schedule recurring reports
- Download reports in multiple formats
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.db_utils import get_user_role
from app.services.reports import (
    get_report_service,
    ReportType,
    ReportFormat
)

router = APIRouter()


# Request/Response schemas
class GenerateReportRequest(BaseModel):
    """Generate report request."""
    report_type: str
    format: str = "pdf"
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    filters: Optional[dict] = None


class ScheduleReportRequest(BaseModel):
    """Schedule report request."""
    report_type: str
    format: str = "pdf"
    schedule: str  # daily, weekly, monthly
    email_to: Optional[str] = None
    filters: Optional[dict] = None


# API Endpoints
@router.get("/types")
async def get_report_types(
    current_user: User = Depends(get_current_active_user)
):
    """Get available report types."""
    service = get_report_service()
    
    role = get_user_role(current_user)
    reports = await service.get_available_reports(role)
    
    return {
        "reports": reports,
        "formats": [f.value for f in ReportFormat]
    }


@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Generate a report."""
    service = get_report_service()
    
    # Validate report type
    try:
        report_type = ReportType(request.report_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid report type: {request.report_type}"
        )
    
    # Validate format
    try:
        format = ReportFormat(request.format)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Use: {[f.value for f in ReportFormat]}"
        )
    
    # Check admin reports
    admin_reports = [
        ReportType.PLATFORM_OVERVIEW,
        ReportType.USER_STATISTICS,
        ReportType.REVENUE_REPORT,
        ReportType.FRAUD_REPORT
    ]
    
    if report_type in admin_reports:
        if get_user_role(current_user) != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required for this report"
            )
    
    report = await service.generate_report(
        report_type=report_type,
        user_id=current_user.id,
        format=format,
        date_from=request.date_from,
        date_to=request.date_to,
        filters=request.filters
    )
    
    return report


@router.get("")
async def list_reports(
    report_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """List user's generated reports."""
    service = get_report_service()
    
    rtype = None
    if report_type:
        try:
            rtype = ReportType(report_type)
        except ValueError:
            pass
    
    reports = await service.list_reports(
        user_id=current_user.id,
        report_type=rtype,
        limit=limit
    )
    
    return {"reports": reports, "count": len(reports)}


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get report details."""
    service = get_report_service()
    
    report = await service.get_report(report_id, current_user.id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.get("/download/{report_id}")
async def download_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Download a generated report."""
    service = get_report_service()
    
    report = await service.get_report(report_id, current_user.id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Report not ready. Status: {report.get('status')}"
        )
    
    # Return the report data
    # In production, would return actual file with proper content-type
    return {
        "report_id": report_id,
        "format": report.get("format"),
        "data": report.get("data"),
        "file_size": report.get("file_size")
    }


@router.post("/schedule")
async def schedule_report(
    request: ScheduleReportRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Schedule recurring report generation."""
    service = get_report_service()
    
    # Validate report type
    try:
        report_type = ReportType(request.report_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid report type: {request.report_type}"
        )
    
    # Validate format
    try:
        format = ReportFormat(request.format)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid format"
        )
    
    # Validate schedule
    if request.schedule not in ["daily", "weekly", "monthly"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid schedule. Use: daily, weekly, monthly"
        )
    
    scheduled = await service.schedule_report(
        report_type=report_type,
        user_id=current_user.id,
        format=format,
        schedule=request.schedule,
        email_to=request.email_to,
        filters=request.filters
    )
    
    return scheduled


@router.get("/scheduled/list")
async def list_scheduled_reports(
    current_user: User = Depends(get_current_active_user)
):
    """List scheduled reports."""
    service = get_report_service()
    
    scheduled = await service.list_scheduled_reports(current_user.id)
    
    return {"scheduled_reports": scheduled, "count": len(scheduled)}


@router.delete("/scheduled/{schedule_id}")
async def cancel_scheduled_report(
    schedule_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a scheduled report."""
    service = get_report_service()
    
    success = await service.cancel_scheduled_report(schedule_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Scheduled report not found")
    
    return {"status": "cancelled", "schedule_id": schedule_id}
